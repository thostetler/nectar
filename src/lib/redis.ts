import Redis, { RedisOptions } from 'ioredis';
import { logger } from '@/logger';

const log = logger.child({}, { msgPrefix: '[redis] ' });

/**
 * Redis connection configuration
 * Supports both standalone and cluster modes with comprehensive error handling
 */
const getRedisConfig = () => {
  const url = process.env.REDIS_URL || 'redis://localhost:6379';

  return {
    url: url,
    keyPrefix: 'scix_',
    username: process.env.REDIS_USERNAME || 'default',
    password: process.env.REDIS_PASSWORD,
    maxRetriesPerRequest: 3,
    retryStrategy: (times: number) => {
      if (times > 20) {
        log.error({ times }, 'Max Redis retry attempts reached, giving up');
        return null;
      }
      const delay = Math.min(times * 50, 2000);
      log.warn({ times, delay }, 'Retrying Redis connection');
      return delay;
    },
    reconnectOnError: (err: Error) => {
      const targetErrors = ['READONLY', 'ECONNRESET', 'ETIMEDOUT'];
      const shouldReconnect = targetErrors.some((target) => err.message.includes(target));
      if (shouldReconnect) {
        log.warn({ err: err.message }, 'Reconnecting on error');
        return true;
      }
      return false;
    },
    lazyConnect: true,
    enableOfflineQueue: true,
    // Timeouts
    connectTimeout: 10000,
    commandTimeout: 5000,
    // Keep-alive
    keepAlive: 30000,
  } as RedisOptions;
};

/**
 * Singleton Redis client with health monitoring and error handling
 */
class RedisClient {
  private static instance: Redis | null = null;
  private static isHealthy: boolean = false;
  private static lastHealthCheck: number = 0;
  private static readonly HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

  private constructor() {}

  /**
   * Get or create Redis instance
   */
  public static getInstance(): Redis {
    if (!RedisClient.instance) {
      try {
        const config = getRedisConfig();
        const url = process.env.REDIS_URL || 'redis://localhost:6379';

        log.info({ url: url.replace(/:[^:]*@/, ':***@') }, 'Initializing Redis connection');

        RedisClient.instance = new Redis(url, config);

        // Connection event handlers
        RedisClient.instance.on('connect', () => {
          log.info('Redis connected');
          RedisClient.isHealthy = true;
        });

        RedisClient.instance.on('ready', () => {
          log.info('Redis ready');
          RedisClient.isHealthy = true;
        });

        RedisClient.instance.on('error', (err) => {
          log.error({ err: err.message, stack: err.stack }, 'Redis error');
          RedisClient.isHealthy = false;
        });

        RedisClient.instance.on('close', () => {
          log.warn('Redis connection closed');
          RedisClient.isHealthy = false;
        });

        RedisClient.instance.on('reconnecting', (delay: number) => {
          log.info({ delay }, 'Redis reconnecting');
        });

        RedisClient.instance.on('end', () => {
          log.warn('Redis connection ended');
          RedisClient.isHealthy = false;
        });
      } catch (err) {
        log.error({ err }, 'Failed to initialize Redis client');
        throw err;
      }
    }

    return RedisClient.instance;
  }

  /**
   * Perform health check on Redis connection
   * Cached for HEALTH_CHECK_INTERVAL to avoid excessive checks
   */
  public static async healthCheck(): Promise<boolean> {
    const now = Date.now();

    // Use cached result if recent
    if (now - RedisClient.lastHealthCheck < RedisClient.HEALTH_CHECK_INTERVAL && RedisClient.isHealthy) {
      return RedisClient.isHealthy;
    }

    try {
      const client = RedisClient.getInstance();
      const start = Date.now();
      const result = await client.ping();
      const duration = Date.now() - start;

      RedisClient.isHealthy = result === 'PONG';
      RedisClient.lastHealthCheck = now;

      if (RedisClient.isHealthy) {
        log.debug({ duration }, 'Redis health check passed');
      } else {
        log.warn({ result }, 'Redis health check failed - unexpected response');
      }

      return RedisClient.isHealthy;
    } catch (err) {
      log.error({ err }, 'Redis health check failed with error');
      RedisClient.isHealthy = false;
      RedisClient.lastHealthCheck = now;
      return false;
    }
  }

  /**
   * Get current health status without performing a check
   */
  public static getHealth(): boolean {
    return RedisClient.isHealthy;
  }

  /**
   * Gracefully close Redis connection
   */
  public static async close(): Promise<void> {
    if (RedisClient.instance) {
      try {
        log.info('Closing Redis connection');
        await RedisClient.instance.quit();
        RedisClient.instance = null;
        RedisClient.isHealthy = false;
        log.info('Redis connection closed successfully');
      } catch (err) {
        log.error({ err }, 'Error closing Redis connection');
        // Force disconnect if quit fails
        if (RedisClient.instance) {
          RedisClient.instance.disconnect();
          RedisClient.instance = null;
        }
      }
    }
  }

  /**
   * Get connection info for debugging
   */
  public static getConnectionInfo(): {
    connected: boolean;
    healthy: boolean;
    lastHealthCheck: number;
  } {
    return {
      connected: RedisClient.instance?.status === 'ready',
      healthy: RedisClient.isHealthy,
      lastHealthCheck: RedisClient.lastHealthCheck,
    };
  }
}

// Export singleton instance and utilities
export const redis = RedisClient.getInstance();
export const redisHealthCheck = RedisClient.healthCheck.bind(RedisClient);
export const getRedisHealth = RedisClient.getHealth.bind(RedisClient);
export const closeRedis = RedisClient.close.bind(RedisClient);
export const getRedisConnectionInfo = RedisClient.getConnectionInfo.bind(RedisClient);

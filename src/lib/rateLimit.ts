import { edgeLogger } from '@/logger';
import { FeatureFlags } from '@/lib/featureFlags';
import { rateLimit as inMemoryRateLimit } from '@/rateLimit';
import type Redis from 'ioredis';

const log = edgeLogger.child({}, { msgPrefix: '[rate-limit] ' });

const RATE_LIMIT_PREFIX = 'rate_limit:';
const MAX_REQUESTS = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10);
const WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10);

/**
 * Lazily load Redis client only when needed
 * This prevents Edge Runtime bundling errors when Redis is not used
 */
let redisClient: Redis | null = null;
async function getRedisClient(): Promise<Redis> {
  if (!redisClient) {
    const { redis } = await import('@/lib/redis');
    redisClient = redis;
  }
  return redisClient;
}

/**
 * Redis-based rate limiting
 * Uses sliding window counter approach with sorted sets
 */
export class RedisRateLimiter {
  /**
   * Check if request is allowed for given key (IP or user ID)
   * @returns true if allowed, false if rate limited
   */
  static async check(key: string, maxRequests = MAX_REQUESTS, windowMs = WINDOW_MS): Promise<boolean> {
    try {
      const redis = await getRedisClient();
      const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      // Use Redis transaction for atomic operations
      const pipeline = redis.pipeline();

      // Remove old entries outside window
      pipeline.zremrangebyscore(redisKey, 0, windowStart);

      // Count requests in current window
      pipeline.zcard(redisKey);

      // Add current request
      pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);

      // Set expiry
      pipeline.expire(redisKey, Math.ceil(windowMs / 1000) + 10); // +10 for safety margin

      const results = await pipeline.exec();

      if (!results) {
        log.error({ key }, 'Redis pipeline returned null results');
        return true; // Fail open
      }

      // Get count from zcard result (index 1)
      const countResult = results[1];
      const count = (countResult && countResult[1]) as number || 0;

      const allowed = count < maxRequests;

      if (!allowed) {
        log.warn({ key, count, maxRequests, windowMs }, 'Rate limit exceeded');
      } else if (FeatureFlags.VERBOSE_SESSION_LOGGING) {
        log.debug({ key, count, maxRequests }, 'Rate limit check passed');
      }

      return allowed;
    } catch (err) {
      log.error({ err, key }, 'Rate limit check failed, allowing request (fail open)');
      // Fail open - allow request if Redis is down
      return true;
    }
  }

  /**
   * Get current count for a key
   */
  static async getCount(key: string, windowMs = WINDOW_MS): Promise<number> {
    try {
      const redis = await getRedisClient();
      const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
      const now = Date.now();
      const windowStart = now - windowMs;

      await redis.zremrangebyscore(redisKey, 0, windowStart);
      return await redis.zcard(redisKey);
    } catch (err) {
      log.error({ err, key }, 'Failed to get rate limit count');
      return 0;
    }
  }

  /**
   * Reset rate limit for a key
   */
  static async reset(key: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const redisKey = `${RATE_LIMIT_PREFIX}${key}`;
      await redis.del(redisKey);
      log.info({ key }, 'Rate limit reset');
    } catch (err) {
      log.error({ err, key }, 'Failed to reset rate limit');
    }
  }
}

/**
 * Convenience function for middleware
 * Automatically selects Redis or in-memory based on feature flag
 */
export async function rateLimit(key: string): Promise<boolean> {
  if (FeatureFlags.REDIS_RATE_LIMIT_ENABLED) {
    return RedisRateLimiter.check(key);
  } else {
    return inMemoryRateLimit(key);
  }
}

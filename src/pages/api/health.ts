import type { NextApiRequest, NextApiResponse } from 'next';
import { redisHealthCheck, getRedisConnectionInfo } from '@/lib/redis';
import { SessionStore } from '@/lib/sessionStore';
import { logger } from '@/logger';
import { FeatureFlags } from '@/lib/featureFlags';

const log = logger.child({}, { msgPrefix: '[api/health] ' });

export interface IHealthResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: number;
  uptime: number;
  redis?: {
    enabled: boolean;
    connected: boolean;
    healthy: boolean;
    lastHealthCheck: number;
  };
  sessions?: {
    totalSessions: number;
    totalIndexes: number;
  };
  featureFlags?: {
    REDIS_SESSIONS_ENABLED: boolean;
    REDIS_RATE_LIMIT_ENABLED: boolean;
    REDIS_SESSIONS_ROLLOUT_PERCENTAGE: number;
  };
}

export default async function health(req: NextApiRequest, res: NextApiResponse<IHealthResponse>) {
  try {
    const redisEnabled = FeatureFlags.REDIS_SESSIONS_ENABLED;
    let redisHealthy = false;
    let redisInfo = null;
    let sessionStats = null;

    if (redisEnabled) {
      // Perform health check
      redisHealthy = await redisHealthCheck();
      redisInfo = getRedisConnectionInfo();

      // Get session statistics if Redis is healthy
      if (redisHealthy) {
        try {
          sessionStats = await SessionStore.getStats();
        } catch (err) {
          log.error({ err }, 'Failed to get session stats for health check');
        }
      }
    }

    // Determine overall status
    let status: 'healthy' | 'degraded' | 'unhealthy';
    if (redisEnabled) {
      if (redisHealthy) {
        status = 'healthy';
      } else {
        status = 'degraded'; // Redis enabled but not healthy - can fall back to iron-session
      }
    } else {
      status = 'healthy'; // Redis not enabled, using iron-session only
    }

    const response: IHealthResponse = {
      status,
      timestamp: Date.now(),
      uptime: process.uptime(),
    };

    // Include Redis info if enabled
    if (redisEnabled && redisInfo) {
      response.redis = {
        enabled: true,
        connected: redisInfo.connected,
        healthy: redisInfo.healthy,
        lastHealthCheck: redisInfo.lastHealthCheck,
      };
    } else if (redisEnabled) {
      response.redis = {
        enabled: true,
        connected: false,
        healthy: false,
        lastHealthCheck: 0,
      };
    }

    // Include session stats if available
    if (sessionStats) {
      response.sessions = sessionStats;
    }

    // Include feature flags for debugging (only in non-production)
    if (process.env.NODE_ENV !== 'production' || req.query.debug === 'true') {
      response.featureFlags = {
        REDIS_SESSIONS_ENABLED: FeatureFlags.REDIS_SESSIONS_ENABLED,
        REDIS_RATE_LIMIT_ENABLED: FeatureFlags.REDIS_RATE_LIMIT_ENABLED,
        REDIS_SESSIONS_ROLLOUT_PERCENTAGE: FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE,
      };
    }

    log.info(response, 'Health check');

    const statusCode = status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503;
    return res.status(statusCode).json(response);
  } catch (err) {
    log.error({ err }, 'Health check failed');
    return res.status(503).json({
      status: 'unhealthy',
      timestamp: Date.now(),
      uptime: process.uptime(),
    });
  }
}

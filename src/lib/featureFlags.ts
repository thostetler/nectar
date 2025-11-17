import { logger } from '@/logger';

const log = logger.child({}, { msgPrefix: '[feature-flags] ' });

/**
 * Feature flags for gradual rollout and A/B testing
 */
export const FeatureFlags = {
  /**
   * Enable Redis-backed sessions
   * When false, falls back to iron-session only
   * Default: false (safe default)
   */
  REDIS_SESSIONS_ENABLED: process.env.REDIS_SESSIONS_ENABLED === 'true',

  /**
   * Percentage of requests to use Redis sessions (0-100)
   * Used for gradual rollout
   * Default: 100 (when REDIS_SESSIONS_ENABLED is true)
   */
  REDIS_SESSIONS_ROLLOUT_PERCENTAGE: parseInt(process.env.REDIS_SESSIONS_ROLLOUT_PERCENTAGE || '100', 10),

  /**
   * Enable Redis-based rate limiting
   * When false, uses in-memory LRU cache
   * Default: follows REDIS_SESSIONS_ENABLED
   */
  REDIS_RATE_LIMIT_ENABLED:
    process.env.REDIS_RATE_LIMIT_ENABLED === 'true' ||
    (process.env.REDIS_RATE_LIMIT_ENABLED !== 'false' && process.env.REDIS_SESSIONS_ENABLED === 'true'),

  /**
   * Enable session activity tracking (lastActivity updates)
   * Can be disabled to reduce Redis writes
   * Default: true
   */
  SESSION_ACTIVITY_TRACKING_ENABLED: process.env.SESSION_ACTIVITY_TRACKING_ENABLED !== 'false',

  /**
   * Enable detailed session logging
   * Default: false (only in development)
   */
  VERBOSE_SESSION_LOGGING: process.env.VERBOSE_SESSION_LOGGING === 'true' || process.env.NODE_ENV === 'development',
} as const;

/**
 * Check if Redis sessions should be used for this request
 * Implements percentage-based rollout
 */
export function shouldUseRedisSessions(sessionId?: string): boolean {
  if (!FeatureFlags.REDIS_SESSIONS_ENABLED) {
    return false;
  }

  // If 100%, always use Redis
  if (FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE >= 100) {
    return true;
  }

  // If 0%, never use Redis
  if (FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE <= 0) {
    return false;
  }

  // Use session ID for consistent bucketing
  // Same session always gets same result (no flapping)
  if (sessionId) {
    const hash = hashString(sessionId);
    const bucket = hash % 100;
    return bucket < FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE;
  }

  // Fallback to random if no session ID
  return Math.random() * 100 < FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE;
}

/**
 * Simple string hash function for consistent bucketing
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Log feature flag status on startup
 */
export function logFeatureFlags(): void {
  log.info(
    {
      REDIS_SESSIONS_ENABLED: FeatureFlags.REDIS_SESSIONS_ENABLED,
      REDIS_SESSIONS_ROLLOUT_PERCENTAGE: FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE,
      REDIS_RATE_LIMIT_ENABLED: FeatureFlags.REDIS_RATE_LIMIT_ENABLED,
      SESSION_ACTIVITY_TRACKING_ENABLED: FeatureFlags.SESSION_ACTIVITY_TRACKING_ENABLED,
      VERBOSE_SESSION_LOGGING: FeatureFlags.VERBOSE_SESSION_LOGGING,
    },
    'Feature flags loaded'
  );
}

/**
 * Get feature flag status for debugging
 */
export function getFeatureFlagStatus(): Record<string, boolean | number> {
  return {
    REDIS_SESSIONS_ENABLED: FeatureFlags.REDIS_SESSIONS_ENABLED,
    REDIS_SESSIONS_ROLLOUT_PERCENTAGE: FeatureFlags.REDIS_SESSIONS_ROLLOUT_PERCENTAGE,
    REDIS_RATE_LIMIT_ENABLED: FeatureFlags.REDIS_RATE_LIMIT_ENABLED,
    SESSION_ACTIVITY_TRACKING_ENABLED: FeatureFlags.SESSION_ACTIVITY_TRACKING_ENABLED,
    VERBOSE_SESSION_LOGGING: FeatureFlags.VERBOSE_SESSION_LOGGING,
  };
}

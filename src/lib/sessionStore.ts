import { IUserData } from '@/api/user/types';
import { logger } from '@/logger';
import crypto from 'crypto';
import type Redis from 'ioredis';

const log = logger.child({}, { msgPrefix: '[session-store] ' });

/**
 * Lazily load Redis client only when needed
 * This prevents Edge Runtime bundling errors when Redis sessions are disabled
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
 * Session data structure stored in Redis
 */
export interface RedisSession {
  sessionId: string;
  userId?: string;
  username?: string;
  token: IUserData;
  isAuthenticated: boolean;
  apiCookieHash: string;
  bot?: boolean;
  createdAt: number;
  lastActivity: number;
  userAgent?: string;
  ip?: string;
}

/**
 * Session TTL configuration
 * Default: 30 days for authenticated, 1 day for anonymous
 */
const SESSION_TTL = {
  authenticated: 30 * 24 * 60 * 60, // 30 days
  anonymous: 24 * 60 * 60, // 1 day
  bot: 7 * 24 * 60 * 60, // 7 days
} as const;

/**
 * Redis key patterns
 */
const KEYS = {
  session: (sessionId: string) => `session:${sessionId}`,
  userSessions: (userId: string) => `user_sessions:${userId}`,
  sessionIndex: (sessionId: string, userId: string) => `session_index:${userId}:${sessionId}`,
} as const;

/**
 * Session store for managing user sessions in Redis
 * Provides comprehensive error handling and logging
 */
export class SessionStore {
  /**
   * Use SCAN to iterate over keys matching a pattern (non-blocking alternative to KEYS)
   * @private
   */
  private static async scanKeys(pattern: string): Promise<string[]> {
    const keys: string[] = [];
    let cursor = '0';

    try {
      const redis = await getRedisClient();
      do {
        const [nextCursor, foundKeys] = await redis.scan(cursor, 'MATCH', pattern, 'COUNT', 100);
        cursor = nextCursor;
        keys.push(...foundKeys);
      } while (cursor !== '0');

      return keys;
    } catch (err) {
      log.error({ err, pattern }, 'Failed to scan keys');
      return [];
    }
  }

  /**
   * Generate a cryptographically secure session ID
   */
  static generateSessionId(): string {
    try {
      return crypto.randomBytes(32).toString('hex');
    } catch (err) {
      log.error({ err }, 'Failed to generate session ID');
      // Fallback to less secure but functional approach
      return `${Date.now()}-${Math.random().toString(36).substring(2)}`;
    }
  }

  /**
   * Get session TTL based on session type
   */
  private static getTTL(session: Partial<RedisSession>): number {
    if (session.bot) return SESSION_TTL.bot;
    if (session.isAuthenticated) return SESSION_TTL.authenticated;
    return SESSION_TTL.anonymous;
  }

  /**
   * Get a session by ID
   * @param sessionId - The session ID to retrieve
   * @returns Session data or null if not found or error occurred
   */
  static async get(sessionId: string): Promise<RedisSession | null> {
    if (!sessionId) {
      log.warn('Attempted to get session with empty session ID');
      return null;
    }

    try {
      const redis = await getRedisClient();
      const key = KEYS.session(sessionId);
      const start = Date.now();
      const data = await redis.get(key);
      const duration = Date.now() - start;

      if (!data) {
        log.debug({ sessionId, duration }, 'Session not found');
        return null;
      }

      const session = JSON.parse(data) as RedisSession;
      log.debug({ sessionId, userId: session.userId, duration }, 'Session retrieved');
      return session;
    } catch (err) {
      log.error({ err, sessionId }, 'Failed to get session from Redis');
      return null;
    }
  }

  /**
   * Create or update a session
   * @param sessionId - The session ID
   * @param session - Session data (without sessionId)
   * @returns true if successful, false otherwise
   */
  static async set(sessionId: string, session: Omit<RedisSession, 'sessionId'>): Promise<boolean> {
    if (!sessionId) {
      log.error('Attempted to set session with empty session ID');
      return false;
    }

    try {
      const redis = await getRedisClient();
      const fullSession: RedisSession = {
        ...session,
        sessionId,
        lastActivity: Date.now(),
      };

      const key = KEYS.session(sessionId);
      const ttl = this.getTTL(fullSession);
      const start = Date.now();

      // Store session with TTL
      await redis.setex(key, ttl, JSON.stringify(fullSession));

      const duration = Date.now() - start;

      // Index by user if authenticated
      if (fullSession.userId && fullSession.isAuthenticated) {
        await this.indexUserSession(sessionId, fullSession.userId, ttl);
      }

      log.info(
        {
          sessionId,
          userId: fullSession.userId,
          isAuthenticated: fullSession.isAuthenticated,
          ttl,
          duration,
        },
        'Session saved to Redis'
      );
      return true;
    } catch (err) {
      log.error({ err, sessionId }, 'Failed to set session in Redis');
      return false;
    }
  }

  /**
   * Update session activity timestamp
   * @param sessionId - The session ID to touch
   * @returns true if successful, false otherwise
   */
  static async touch(sessionId: string): Promise<boolean> {
    if (!sessionId) {
      log.warn('Attempted to touch session with empty session ID');
      return false;
    }

    try {
      const session = await this.get(sessionId);
      if (!session) {
        log.debug({ sessionId }, 'Cannot touch non-existent session');
        return false;
      }

      session.lastActivity = Date.now();
      return await this.set(sessionId, session);
    } catch (err) {
      log.error({ err, sessionId }, 'Failed to touch session');
      return false;
    }
  }

  /**
   * Destroy a session
   * @param sessionId - The session ID to destroy
   * @returns true if successful, false otherwise
   */
  static async destroy(sessionId: string): Promise<boolean> {
    if (!sessionId) {
      log.warn('Attempted to destroy session with empty session ID');
      return false;
    }

    try {
      const redis = await getRedisClient();
      const session = await this.get(sessionId);
      const key = KEYS.session(sessionId);

      const deleted = await redis.del(key);

      // Remove from user index if authenticated
      if (session?.userId) {
        await this.removeUserSessionIndex(sessionId, session.userId);
      }

      log.info({ sessionId, userId: session?.userId, deleted }, 'Session destroyed');
      return deleted > 0;
    } catch (err) {
      log.error({ err, sessionId }, 'Failed to destroy session');
      return false;
    }
  }

  /**
   * Index a session for a user (for listing all user sessions)
   * @private
   */
  private static async indexUserSession(sessionId: string, userId: string, ttl: number): Promise<void> {
    try {
      const redis = await getRedisClient();
      const indexKey = KEYS.sessionIndex(sessionId, userId);
      await redis.setex(indexKey, ttl, sessionId);
      log.debug({ sessionId, userId }, 'Session indexed for user');
    } catch (err) {
      log.error({ err, sessionId, userId }, 'Failed to index session for user');
      // Don't throw - indexing is not critical for core functionality
    }
  }

  /**
   * Remove session from user index
   * @private
   */
  private static async removeUserSessionIndex(sessionId: string, userId: string): Promise<void> {
    try {
      const redis = await getRedisClient();
      const indexKey = KEYS.sessionIndex(sessionId, userId);
      await redis.del(indexKey);
      log.debug({ sessionId, userId }, 'Session removed from user index');
    } catch (err) {
      log.error({ err, sessionId, userId }, 'Failed to remove session from user index');
      // Don't throw - this is cleanup
    }
  }

  /**
   * Get all sessions for a user
   * @param userId - The user ID
   * @returns Array of sessions (empty array on error)
   */
  static async getUserSessions(userId: string): Promise<RedisSession[]> {
    if (!userId) {
      log.warn('Attempted to get user sessions with empty user ID');
      return [];
    }

    try {
      const redis = await getRedisClient();
      const pattern = `session_index:${userId}:*`;
      const start = Date.now();
      const keys = await this.scanKeys(pattern);
      const duration = Date.now() - start;

      if (keys.length === 0) {
        log.debug({ userId, duration }, 'No sessions found for user');
        return [];
      }

      const sessionIds = await redis.mget(...keys);
      const sessions = await Promise.all(
        sessionIds.filter((id): id is string => id !== null).map((id) => this.get(id))
      );

      const validSessions = sessions.filter((s): s is RedisSession => s !== null);

      log.info({ userId, count: validSessions.length, duration }, 'Retrieved user sessions');
      return validSessions;
    } catch (err) {
      log.error({ err, userId }, 'Failed to get user sessions');
      return [];
    }
  }

  /**
   * Destroy all sessions for a user except optionally the current one
   * @param userId - The user ID
   * @param excludeSessionId - Optional session ID to exclude from destruction
   * @returns Number of sessions destroyed
   */
  static async destroyAllUserSessions(userId: string, excludeSessionId?: string): Promise<number> {
    if (!userId) {
      log.warn('Attempted to destroy user sessions with empty user ID');
      return 0;
    }

    try {
      const sessions = await this.getUserSessions(userId);
      const sessionsToDestroy = excludeSessionId
        ? sessions.filter((s) => s.sessionId !== excludeSessionId)
        : sessions;

      const results = await Promise.allSettled(sessionsToDestroy.map((session) => this.destroy(session.sessionId)));

      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value === true).length;

      log.info(
        {
          userId,
          total: sessionsToDestroy.length,
          destroyed: successCount,
          excluded: excludeSessionId || null,
        },
        'Destroyed user sessions'
      );

      return successCount;
    } catch (err) {
      log.error({ err, userId }, 'Failed to destroy all user sessions');
      return 0;
    }
  }

  /**
   * Clean up expired sessions
   * Note: Redis will auto-expire, but this helps clean up orphaned indexes
   * Should be run periodically via cron job
   */
  static async cleanup(): Promise<{ cleaned: number; errors: number }> {
    let cleaned = 0;
    let errors = 0;

    try {
      const redis = await getRedisClient();
      const pattern = 'session_index:*';
      const keys = await this.scanKeys(pattern);

      log.info({ count: keys.length }, 'Starting session cleanup');

      for (const key of keys) {
        try {
          const sessionId = await redis.get(key);
          if (sessionId) {
            const exists = await redis.exists(KEYS.session(sessionId));
            if (!exists) {
              await redis.del(key);
              cleaned++;
            }
          }
        } catch (err) {
          log.error({ err, key }, 'Error cleaning up session index');
          errors++;
        }
      }

      log.info({ cleaned, errors, total: keys.length }, 'Session cleanup complete');
      return { cleaned, errors };
    } catch (err) {
      log.error({ err }, 'Session cleanup failed');
      return { cleaned, errors };
    }
  }

  /**
   * Get session statistics
   * @returns Statistics about sessions in Redis
   */
  static async getStats(): Promise<{
    totalSessions: number;
    totalIndexes: number;
  }> {
    try {
      const [sessionKeys, indexKeys] = await Promise.all([
        this.scanKeys('session:*'),
        this.scanKeys('session_index:*'),
      ]);

      const stats = {
        totalSessions: sessionKeys.length,
        totalIndexes: indexKeys.length,
      };

      log.debug(stats, 'Session statistics');
      return stats;
    } catch (err) {
      log.error({ err }, 'Failed to get session stats');
      return {
        totalSessions: 0,
        totalIndexes: 0,
      };
    }
  }
}

/**
 * Next.js Instrumentation
 * This file is loaded once when the server starts
 * Use it to initialize services like Redis and Sentry
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Initialize Sentry
    await import('../sentry.server.config');

    // Initialize Redis handler
    try {
      const { logger } = await import('@/logger');
      const log = logger.child({}, { msgPrefix: '[instrumentation] ' });

      log.info('Loading Redis handler...');

      // Import Redis and related utilities
      // The redis import triggers initialization of the Redis client
      await import('@/lib/redis');
      const { redisHealthCheck, getRedisConnectionInfo } = await import('@/lib/redis');
      const { logFeatureFlags } = await import('@/lib/featureFlags');

      // Log feature flags
      logFeatureFlags();

      // Perform health check to ensure Redis is connected
      const isHealthy = await redisHealthCheck();

      if (isHealthy) {
        const connectionInfo = getRedisConnectionInfo();
        log.info({ connectionInfo }, '✓ Redis handler loaded and connected successfully');
      } else {
        log.warn('⚠ Redis handler loaded but connection is unhealthy - will fallback to iron-session');
      }
    } catch (error) {
      const { logger } = await import('@/logger');
      const log = logger.child({}, { msgPrefix: '[instrumentation] ' });
      log.error({ error }, '✗ Failed to load Redis handler - will fallback to iron-session');
    }
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    await import('../sentry.edge.config');
  }
}

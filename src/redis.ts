import { logger } from '@/logger';
import Redis, { RedisOptions } from 'ioredis';

const log = logger.child({}, { msgPrefix: '[redis] ' });
export const createRedisInstance = () => {
  try {
    const options: RedisOptions = {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
      password: process.env.REDIS_PASSWORD,
      lazyConnect: true,
      showFriendlyErrorStack: true,
      enableAutoPipelining: true,
      maxRetriesPerRequest: 0,
      retryStrategy: (times) => {
        if (times > 3) {
          throw new Error(`Could not connect to Redis after ${times} attempts`);
        }
        return Math.min(times * 200, 1000);
      },
    };

    const redis = new Redis(options);

    redis.on('error', (error: unknown) => log.error({ msg: 'Connection Error', error }));
    redis.on('ready', () => log.debug('Connected and ready'));

    return redis;
  } catch (error) {
    log.error({ msg: 'Error creating Redis Instance', error });
  }
};

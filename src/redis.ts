import Redis from 'ioredis';

let redis: Redis;

if (!redis) {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
  });
}

export default redis;

import type { NextApiRequest, NextApiResponse } from 'next'
import redis from '@/redis';
import { HttpStatusCode } from 'axios';

// 1 minute window
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 100;

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === 'POST') {
    const body = JSON.parse(req.body as string) as { ip: string };

    const redisKey = `rate-limit-${body.ip}`;
    const requests = await redis.incr(redisKey);

    if (requests === 1) {
      await redis.pexpire(redisKey, WINDOW_MS);
    }

    return res.status(200).json({ curr: requests, max: MAX_REQUESTS, remaining: MAX_REQUESTS - requests })
  }

  res.status(HttpStatusCode.MethodNotAllowed).json('Method Not Allowed')
}

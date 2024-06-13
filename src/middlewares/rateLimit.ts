import { NextApiRequest, NextApiResponse } from 'next';

const rateLimitMap = new Map<string, { count: number; lastReset: number }>();

const getIp = (req: NextApiRequest) =>
  (req.headers['X-Original-Forwarded-For'] || req.headers['X-Forwarded-For'] || req.headers['X-Real-Ip']) as string;

export default function rateLimitMiddleware(handler: (req: NextApiRequest, res: NextApiResponse) => void) {
  return (req: NextApiRequest, res: NextApiResponse) => {
    const ip = getIp(req);
    const limit = 5; // Limiting requests to 5 per minute per IP
    const windowMs = 60 * 1000; // 1 minute

    if (!rateLimitMap.has(ip)) {
      rateLimitMap.set(ip, {
        count: 0,
        lastReset: Date.now(),
      });
    }

    const ipData = rateLimitMap.get(ip);

    if (Date.now() - ipData.lastReset > windowMs) {
      ipData.count = 0;
      ipData.lastReset = Date.now();
    }

    if (ipData.count >= limit) {
      return res.status(429).send('Too Many Requests');
    }

    ipData.count += 1;

    return handler(req, res);
  };
}

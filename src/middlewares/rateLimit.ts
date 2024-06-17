import { NextApiRequest, NextApiResponse } from 'next';
import { getIp } from './helpers';
import { NextRequest, NextResponse } from 'next/server';
import { logger, edgeLogger } from '@/logger';

const hit = async (url: string, ip: string) => await fetch(new URL('/api/isBot', url), {
  method: 'POST',
  body: JSON.stringify({ ip }),
}).then(res => res.json()) as { curr: number; max: number };

export const rateLimit = async (req: NextRequest) => {
  const ip = getIp(req);
  const { curr, max } = await hit(req.nextUrl.toString(), ip);

  if (curr > max) {
    edgeLogger.info({ msg: 'Rate limit reached', ip, curr, max })
    return NextResponse.json(
      { message: 'Too many requests from this IP, please try again later.' },
      { status: 429 }
    );
  }

  return NextResponse.next();
};

export const apiRateLimitApi = async (req: NextApiRequest, res: NextApiResponse) => {
  const ip = getIp(req);
  const { curr, max } = await hit(req.url, ip);

  if (curr > max) {
    logger.info({ msg: 'Rate limit reached', ip, curr, max })
    return res.status(429).send('Too Many Requests');
  }

  return res;
}

/// <reference types="../../../../global" />
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@/config';
import { IronSession } from 'iron-session';
import { logger } from '@/logger';

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
}

const handler = (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method !== 'GET') {
    logger.debug('Method Not Allowed');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  if (!req.session?.token) {
    logger.debug('Session invalid, request is not authenticated');
    return res.status(401).json({ error: 'Not Authenticated' });
  }

  return res.json({
    isAuthenticated: req.session.isAuthenticated,
    user: req.session.token,
  });
};

export default withIronSessionApiRoute(handler, sessionConfig);

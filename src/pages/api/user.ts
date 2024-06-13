/// <reference types="../../../global" />
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@/config';
import { IronSession } from 'iron-session';
import rateLimitMiddleware from '@/middlewares/rateLimit';

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
}

const user = (req: NextApiRequest, res: NextApiResponse) => {
  return res.json({
    isAuthenticated: req.session.isAuthenticated,
    user: req.session.token,
  });
};

export default withIronSessionApiRoute(rateLimitMiddleware(user), sessionConfig);

/// <reference types="../../../../global" />
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@/config';
import { IronSession } from 'iron-session';
import axios from 'axios';
import { ApiTargets, IBootstrapPayload } from '@/api';
import { logger } from '@/logger';
import { pick } from 'ramda';

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
}

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  logger.debug({ method: req.method }, 'Refetch request received');

  // disallow requests via GET,
  if (req.method !== 'POST') {
    logger.debug('Method not allowed');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // disallow access if request does not have a cookie
  // TODO: should "verify" session, not just detect one
  if (!req.session?.token) {
    logger.error('request not authenticated');
    return res.status(401).json({ error: 'Not Authenticated' });
  }

  try {
    logger.debug('Bootstrapping token');

    const { data, headers } = await axios.request<IBootstrapPayload>({
      method: 'GET',
      baseURL: process.env.API_HOST_SERVER,
      url: ApiTargets.BOOTSTRAP,
      headers: {
        'X-Original-Uri': req.headers['X-Original-Uri'],
        'X-Original-Forwarded-For': req.headers['X-Original-Forwarded-For'],
        'X-Forwarded-For': req.headers['X-Forwarded-For'],
        'X-Amzn-Trace-Id': req.headers['X-Amzn-Trace-Id'],
        Cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${req.cookies[process.env.ADS_SESSION_COOKIE_NAME]}`,
      },
    });

    logger.debug({ data }, 'Bootstrap Successful');

    // forward the set-cookie
    res.setHeader('set-cookie', headers['set-cookie']);

    // apply token to the session
    req.session.token = pick<keyof IBootstrapPayload>(['access_token', 'expire_in', 'anonymous', 'username'])(data);
    req.session.isAuthenticated = !data.anonymous;
    await req.session.save();

    return res.json({
      isAuthenticated: req.session.isAuthenticated,
      user: req.session.token,
    });
  } catch (e) {
    logger.error({ err: e }, 'Bootstrapping failed');
    return res.status(401).json({ error: 'Not Authenticated' });
  }
};

export default withIronSessionApiRoute(handler, sessionConfig);

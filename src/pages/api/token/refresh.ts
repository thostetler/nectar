/// <reference types="../../../../global" />
import { withIronSessionApiRoute } from 'iron-session/next';
import { NextApiRequest, NextApiResponse } from 'next';
import { sessionConfig } from '@/config';
import { IronSession } from 'iron-session';
import axios from 'axios';
import { ApiTargets, IBootstrapPayload } from '@/api';
import { logger } from '@/logger';
import { pick } from 'ramda';
import { IncomingMessage } from 'http';
import { TRACING_HEADERS } from '@/config';

export const config = {
  api: {
    bodyParser: false,
  },
};

export interface IApiUserResponse {
  isAuthenticated: boolean;
  user: IronSession['token'];
}

export type TokenResponse = {
  isAuthenticated?: boolean;
  user?: {
    access_token: string;
    expire_in: string;
    anonymous: boolean;
    username: string
  }
  error?: string;
}

const getHeaders = (req: IncomingMessage) => {
  const headers: Record<string, string | string[]> = {
    'Content-Type': 'application/json'
  };
  TRACING_HEADERS.forEach((key) => {
    if (req.headers[key]) {
      headers[key] = req.headers[key];
    }
  })
  return headers;
}

const handler = async (req: NextApiRequest, res: NextApiResponse<TokenResponse>) => {
  logger.debug({ method: req.method }, 'Refetch request received');

  // disallow requests via GET,
  if (req.method !== 'POST') {
    logger.debug('Method not allowed');
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // disallow access if request does not have a cookie
  // TODO: should "verify" session, not just detect one
  if (!req.session?.initialized) {
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
        ...getHeaders(req),
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

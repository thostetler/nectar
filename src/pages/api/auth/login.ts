import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { IronSession } from 'iron-session';
import { APP_DEFAULTS, getSessionConfig } from '@/config';
import { configWithCSRF, fetchUserData, isValidToken } from '@/auth-utils';
import { defaultRequestConfig } from '@/api/config';
import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import setCookie from 'set-cookie-parser';
import { IBasicAccountsResponse, IUserCredentials } from '@/api/user';
import { ApiTargets } from '@/api/models';
import { logger } from '@/logger';
import { loginUser } from '@/auth';
import { getIronSession } from 'iron-session/edge';

const log = logger.child({}, { msgPrefix: '[api/login] ' });

export interface ILoginResponse {
  success?: boolean;
  error?: 'invalid-credentials' | 'login-failed' | 'failed-userdata-request' | 'invalid-token' | 'method-not-allowed';
}

async function login(req: NextApiRequest, res: NextApiResponse<ILoginResponse>) {
  if (req.method !== 'POST') {
    return res.status(HttpStatusCode.MethodNotAllowed).json({ success: false, error: 'method-not-allowed' });
  }
  const session = await getIronSession(req, res, getSessionConfig());

  const creds = schema.safeParse(req.body);
  if (creds.success) {
    try {
      const user = await loginUser(creds.data, req, res);
      if (user) {
        session.auth = {
          apiToken: user.access_token,
          isAuthenticated: !user.anonymous,
          expires: user.expire_in,
        };
        session.user = {
          email: user.username,
        };
        await session.save();

        return res.status(HttpStatusCode.Ok).json({ success: true });
      }
    } catch (error) {
      log.error('Login failed', { error });
    }
  }
  return res.status(HttpStatusCode.Unauthorized).json({ success: false, error: 'invalid-credentials' });
}

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
  })
  .required() as z.ZodSchema<IUserCredentials>;

export const handleAuthentication = async (
  credentials: IUserCredentials,
  res: NextApiResponse,
  session: IronSession,
) => {
  const config = await configWithCSRF({
    ...defaultRequestConfig,
    method: 'POST',
    url: ApiTargets.USER,
    data: {
      username: credentials.email,
      password: credentials.password,
    },
    timeout: APP_DEFAULTS.API_TIMEOUT,
  });

  try {
    const { data, headers } = await axios.request<IBasicAccountsResponse, AxiosResponse<IBasicAccountsResponse>>(
      config,
    );
    const apiSessionCookie = setCookie
      .parse(headers['set-cookie'])
      .find((c) => c.name === process.env.ADS_SESSION_COOKIE_NAME);

    if (data.message === 'success') {
      // user has been authenticated
      session.destroy();

      // apply the session cookie to the response
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        // fetch the authenticated user data
        const { data: userData } = await fetchUserData({
          headers: {
            // set the returned session cookie
            Cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${apiSessionCookie?.value}`,
          },
        });

        if (isValidToken(userData)) {
          // token is valid, we can save the session
          session.auth = {
            apiToken: userData.access_token,
            isAuthenticated: !userData.anonymous,
            expires: userData.expire_in,
          };
          await session.save();
          log.info('session updated, success');
          return res.status(200).json({ success: true });
        } else {
          // in the case the token is invalid, redirect to root
          log.debug('Invalid user-data, not updating session', { userData, session });
          return res.status(200).json({ success: false, error: 'invalid-token' });
        }
      } catch (error) {
        log.trace('Login failed during bootstrapping step', { error });

        // if there is an error fetching the user data, we can recover later in a subsequent request
        return res.status(200).json({ success: false, error: 'failed-userdata-request' });
      }
    }
    log.debug('Login failed', { data });
    return res.status(401).json({ success: false, error: 'login-failed' });
  } catch (error) {
    log.trace('Login failed', { error });
    return res.status(401).json({ success: false, error: 'login-failed' });
  }
};

import type { NextApiRequest, NextApiResponse } from 'next';
import { z } from 'zod';
import { IronSession } from 'iron-session';
import { withIronSessionApiRoute } from 'iron-session/next';
import { APP_DEFAULTS, sessionConfig } from '@/config';
import { configWithCSRF, fetchUserData, hash, isValidToken, pickUserData } from '@/auth-utils';
import { defaultRequestConfig } from '@/api/config';
import axios, { AxiosResponse, HttpStatusCode } from 'axios';
import setCookie from 'set-cookie-parser';
import { logger } from '@/logger';
import { IBasicAccountsResponse, IUserCredentials } from '@/api/user/types';
import { ApiTargets } from '@/api/models';
import { SessionStore } from '@/lib/sessionStore';
import { shouldUseRedisSessions } from '@/lib/featureFlags';

const log = logger.child({}, { msgPrefix: '[api/login] ' });

export interface ILoginResponse {
  success?: boolean;
  error?:
    | 'invalid-credentials'
    | 'login-failed'
    | 'failed-userdata-request'
    | 'invalid-token'
    | 'method-not-allowed'
    | 'must-reset-credentials';
}

export default withIronSessionApiRoute(login, sessionConfig);

async function login(req: NextApiRequest, res: NextApiResponse<ILoginResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method-not-allowed' });
  }

  const session = req.session;
  const creds = schema.safeParse(req.body);
  if (creds.success) {
    return await handleAuthentication(creds.data, res, session, req);
  }
  return res.status(401).json({ success: false, error: 'invalid-credentials' });
}

const schema = z
  .object({
    email: z.string().email(),
    password: z.string().min(4),
  })
  .required() as z.ZodSchema<IUserCredentials>;

/**
 * Get IP address from request headers
 */
const getIp = (req: NextApiRequest) =>
  (
    req.headers['x-original-forwarded-for'] ||
    req.headers['x-forwarded-for'] ||
    req.headers['x-real-ip'] ||
    ''
  )
    .toString()
    .split(',')
    .shift() || 'unknown';

export const handleAuthentication = async (
  credentials: IUserCredentials,
  res: NextApiResponse,
  session: IronSession,
  req: NextApiRequest,
) => {
  const useRedis = shouldUseRedisSessions(session.sessionId as string);

  try {
    const config = await configWithCSRF({
      ...defaultRequestConfig,
      method: 'POST',
      url: ApiTargets.LOGIN,
      data: credentials,
      timeout: APP_DEFAULTS.API_TIMEOUT,
    });
    log.debug({ config }, 'Attempting to login user');
    const { data, headers, status } = await axios.request<
      IBasicAccountsResponse,
      AxiosResponse<IBasicAccountsResponse>
    >(config);

    log.debug({ data, headers }, 'Result');
    const apiSessionCookie = setCookie
      .parse(headers['set-cookie'])
      .find((c) => c.name === process.env.ADS_SESSION_COOKIE_NAME);

    if (status === HttpStatusCode.Ok) {
      // Get or create session ID
      let sessionId = session.sessionId as string;
      if (!sessionId) {
        sessionId = SessionStore.generateSessionId();
      }

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
          const token = pickUserData(userData);
          const apiCookieHash = await hash(apiSessionCookie?.value);

          if (!apiCookieHash) {
            log.error('Failed to hash API cookie during login');
            return res.status(500).json({ success: false, error: 'login-failed' });
          }

          // Save to Redis if enabled
          if (useRedis) {
            const saved = await SessionStore.set(sessionId, {
              userId: userData.username,
              username: userData.username,
              token,
              isAuthenticated: true,
              apiCookieHash,
              createdAt: Date.now(),
              lastActivity: Date.now(),
              userAgent: req.headers['user-agent'] || undefined,
              ip: getIp(req),
            });

            if (!saved) {
              log.error({ sessionId }, 'Failed to save session to Redis during login');
            } else {
              log.info({ sessionId, userId: userData.username, useRedis: true }, 'Login successful - session saved to Redis');
            }
          }

          // Update iron-session
          session.sessionId = sessionId;
          session.token = token;
          session.isAuthenticated = true;
          session.apiCookieHash = apiCookieHash;
          await session.save();

          log.info({ sessionId, userId: userData.username, useRedis }, 'Login successful - session updated');
          return res.status(200).json({ success: true });
        } else {
          // in the case the token is invalid, redirect to root
          log.debug('Invalid user-data, not updating session', { userData });
          return res.status(200).json({ success: false, error: 'invalid-token' });
        }
      } catch (error) {
        log.trace('Login failed during bootstrapping step', { error });

        // if there is an error fetching the user data, we can recover later in a subsequent request
        return res.status(200).json({ success: false, error: 'failed-userdata-request' });
      }
    }
    log.debug({ data }, 'Login failed');
    return res.status(401).json({ success: false, error: 'login-failed' });
  } catch (err) {
    log.error({ err }, 'Login failed');

    // if the login failed due to a password reset requirement, return a specific error
    if (axios.isAxiosError(err) && err.response && err.response.status === HttpStatusCode.UnprocessableEntity) {
      return res.status(401).json({ success: false, error: 'must-reset-credentials' });
    }

    return res.status(401).json({ success: false, error: 'login-failed' });
  }
};

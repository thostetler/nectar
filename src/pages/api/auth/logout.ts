import type { NextApiRequest, NextApiResponse } from 'next';
import { APP_DEFAULTS, sessionConfig } from '@/config';
import { configWithCSRF, fetchUserData, hash, isValidToken, pickUserData } from '@/auth-utils';
import { defaultRequestConfig } from '@/api/config';
import axios, { AxiosResponse } from 'axios';
import setCookie from 'set-cookie-parser';
import { withIronSessionApiRoute } from 'iron-session/next';
import { logger } from '@/logger';
import { ApiTargets } from '@/api/models';
import { IBasicAccountsResponse } from '@/api/user/types';
import { SessionStore } from '@/lib/sessionStore';
import { shouldUseRedisSessions } from '@/lib/featureFlags';

export interface ILogoutResponse {
  success?: boolean;
  error?: 'logout-failed' | 'failed-userdata-request' | 'invalid-token' | 'method-not-allowed';
}

const log = logger.child({}, { msgPrefix: '[api/logout] ' });

export default withIronSessionApiRoute(logout, sessionConfig);

async function logout(req: NextApiRequest, res: NextApiResponse<ILogoutResponse>) {
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'method-not-allowed' });
  }

  const session = req.session;
  const sessionId = session.sessionId as string;
  const useRedis = shouldUseRedisSessions(sessionId);

  const config = await configWithCSRF({
    ...defaultRequestConfig,
    url: ApiTargets.LOGOUT,
    method: 'POST',
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
      // Destroy session in Redis if enabled
      if (useRedis && sessionId) {
        const destroyed = await SessionStore.destroy(sessionId);
        if (destroyed) {
          log.info({ sessionId, useRedis: true }, 'Session destroyed in Redis');
        } else {
          log.warn({ sessionId }, 'Failed to destroy session in Redis');
        }
      }

      // clear our iron-session
      session.destroy();

      // apply the session cookie to the response
      res.setHeader('set-cookie', headers['set-cookie']);

      try {
        // fetch the authenticated user data (new anonymous token)
        const { data: userData } = await fetchUserData({
          headers: {
            // set the returned session cookie
            Cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${apiSessionCookie?.value}`,
          },
        });

        if (isValidToken(userData)) {
          // Create new session with anonymous token
          const newSessionId = SessionStore.generateSessionId();
          const token = pickUserData(userData);
          const apiCookieHash = await hash(apiSessionCookie?.value);

          if (!apiCookieHash) {
            log.error('Failed to hash API cookie during logout');
            return res.status(500).json({ success: false, error: 'logout-failed' });
          }

          // Save new anonymous session to Redis if enabled
          if (useRedis) {
            await SessionStore.set(newSessionId, {
              username: userData.username,
              token,
              isAuthenticated: false,
              apiCookieHash,
              createdAt: Date.now(),
              lastActivity: Date.now(),
              userAgent: req.headers['user-agent'] || undefined,
              ip:
                (
                  req.headers['x-original-forwarded-for'] ||
                  req.headers['x-forwarded-for'] ||
                  req.headers['x-real-ip'] ||
                  ''
                )
                  .toString()
                  .split(',')
                  .shift() || 'unknown',
            });
          }

          // Update iron-session with new anonymous session
          session.sessionId = newSessionId;
          session.token = token;
          session.isAuthenticated = false;
          session.apiCookieHash = apiCookieHash;
          await session.save();

          log.info({ sessionId, newSessionId, useRedis }, 'Logout successful');
          return res.status(200).json({ success: true });
        } else {
          // in the case the token is invalid, redirect to root
          log.debug('Invalid user-data, not updating session', { userData });
          return res.status(200).json({ success: false, error: 'invalid-token' });
        }
      } catch (e) {
        log.trace('Logout failed during bootstrapping step', { error: e });

        // if there is an error fetching the user data, we can recover later in a subsequent request
        return res.status(200).json({ success: false, error: 'failed-userdata-request' });
      }
    }
    log.debug('Logout failed', { data });
    return res.status(401).json({ success: false, error: 'logout-failed' });
  } catch (e) {
    log.trace('Logout failed', { error: e });
    return res.status(401).json({ success: false, error: 'logout-failed' });
  }
}

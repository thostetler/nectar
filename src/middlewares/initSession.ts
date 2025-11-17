import { IronSession } from 'iron-session';
import { ApiTargets } from '@/api/models';
import { IBootstrapPayload, IUserData } from '@/api/user/types';
import { pick } from 'ramda';
import { edgeLogger } from '@/logger';
import { NextRequest, NextResponse } from 'next/server';
import setCookie from 'set-cookie-parser';
import { botCheck } from '@/middlewares/botCheck';
import { SessionStore } from '@/lib/sessionStore';
import { shouldUseRedisSessions, FeatureFlags } from '@/lib/featureFlags';

const log = edgeLogger.child({}, { msgPrefix: '[initSession] ' });

/**
 * Checks if the user data is valid
 * @param userData
 */
export const isUserData = (userData?: IUserData): userData is IUserData =>
  typeof userData !== 'undefined' &&
  typeof userData.access_token === 'string' &&
  typeof userData.expires_at === 'string' &&
  userData.access_token.length > 0 &&
  userData.expires_at.length > 0;

/**
 * Checks if a token is expired based on the expiration time.
 *
 * @param {string} expiresAt - The expiration time of the token in seconds since the Unix epoch.
 * @returns {boolean} - Returns true if the current time is greater than or equal to the expiration time, false otherwise.
 */
export const isTokenExpired = (expiresAt: string): boolean => {
  const currentTime = Math.floor(Date.now() / 1000);
  const tokenExpiryTime = parseInt(expiresAt, 10);
  return currentTime >= tokenExpiryTime;
};

/**
 * Checks if the token is valid
 * @param userData
 */
export const isValidToken = (userData?: IUserData): boolean =>
  isUserData(userData) && !isTokenExpired(userData.expires_at);

/**
 * Checks if the user is authenticated
 * @param user
 */
export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

/**
 * Bootstraps the session (to get a new token)
 * @param cookie
 */
const bootstrap = async (cookie?: string) => {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return {
      token: {
        access_token: 'mocked',
        username: 'mocked',
        anonymous: false,
        expires_at: 'mocked',
      },
      headers: new Headers({
        'set-cookie': `${process.env.ADS_SESSION_COOKIE_NAME}=mocked`,
      }),
    };
  }

  const url = `${process.env.API_HOST_SERVER}${ApiTargets.BOOTSTRAP}`;
  const headers = new Headers();

  // use the incoming session cookie to perform the bootstrap
  if (cookie) {
    headers.append('cookie', `${process.env.ADS_SESSION_COOKIE_NAME}=${cookie}`);
  }
  try {
    log.debug('Bootstrapping');
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    const json = (await res.json()) as IBootstrapPayload;
    log.debug({
      msg: 'Bootstrap successful',
      payload: json,
    });
    return {
      token: pick(['access_token', 'username', 'anonymous', 'expires_at'], json) as IUserData,
      headers: res.headers,
    };
  } catch (error) {
    log.error({
      msg: 'Bootstrapping failed',
      error,
    });
    return null;
  }
};

/**
 * Hashes a string using SHA-1
 * @param str
 */
const hash = async (str?: string) => {
  if (!str) {
    return null;
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
    return Array.from(new Uint8Array(buffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  } catch (err) {
    log.error({ err, str }, 'Error caught attempting to hash string');
    return null;
  }
};

/**
 * Get IP address from request headers
 */
const getIp = (req: NextRequest) =>
  (
    req.headers.get('X-Original-Forwarded-For') ||
    req.headers.get('X-Forwarded-For') ||
    req.headers.get('X-Real-Ip') ||
    ''
  )
    .split(',')
    .shift() || 'unknown';

/**
 * Initialize session using Redis backend
 */
const initSessionWithRedis = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  try {
    // Get or create session ID
    let sessionId = session.sessionId as string;
    if (!sessionId) {
      sessionId = SessionStore.generateSessionId();
      session.sessionId = sessionId;
    }

    const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
    const apiCookieHash = await hash(adsSessionCookie);

    // Try to load session from Redis
    const redisSession = await SessionStore.get(sessionId);

    if (FeatureFlags.VERBOSE_SESSION_LOGGING) {
      log.debug({ sessionId, hasRedisSession: !!redisSession }, 'Redis session lookup');
    }

    // Validate existing session
    const isUserIdentifiedAsBot = redisSession?.bot && isValidToken(redisSession?.token);
    const hasRefreshTokenHeader = req.headers.has('x-refresh-token');
    const isTokenValid = isValidToken(redisSession?.token);
    const isApiCookieHashPresent = apiCookieHash !== null;
    const isApiCookieHashMatching = apiCookieHash === redisSession?.apiCookieHash;

    const isValidSession =
      isUserIdentifiedAsBot ||
      (!hasRefreshTokenHeader && isTokenValid && isApiCookieHashPresent && isApiCookieHashMatching);

    if (isValidSession && redisSession) {
      if (FeatureFlags.VERBOSE_SESSION_LOGGING) {
        log.debug({ sessionId }, 'Redis session is valid');
      }

      // Update activity timestamp asynchronously if enabled
      if (FeatureFlags.SESSION_ACTIVITY_TRACKING_ENABLED) {
        void SessionStore.touch(sessionId).catch((err) => {
          log.error({ err, sessionId }, 'Failed to touch session');
        });
      }

      // Update iron-session with minimal data
      session.sessionId = sessionId;
      session.token = redisSession.token;
      session.isAuthenticated = redisSession.isAuthenticated;
      session.apiCookieHash = redisSession.apiCookieHash;
      await session.save();

      return res;
    }

    log.debug({ sessionId }, 'Redis session is invalid or expired, creating new one');

    // Check if the user is a bot
    await botCheck(req, res);

    // Bootstrap a new token
    const { token, headers } = (await bootstrap(adsSessionCookie)) ?? {};

    // Validate token, update session, forward cookies
    if (isValidToken(token)) {
      log.debug({ sessionId }, 'Refreshed token is valid');

      const authenticated = isAuthenticated(token);
      const sessionCookieValue = setCookie.parse(headers.get('set-cookie') ?? '')[0]?.value;
      const newApiCookieHash = await hash(sessionCookieValue);

      // Save to Redis
      const saved = await SessionStore.set(sessionId, {
        userId: authenticated ? token.username : undefined,
        username: token.username,
        token,
        isAuthenticated: authenticated,
        apiCookieHash: newApiCookieHash,
        bot: session.bot,
        createdAt: Date.now(),
        lastActivity: Date.now(),
        userAgent: req.headers.get('user-agent') || undefined,
        ip: getIp(req),
      });

      if (!saved) {
        log.error({ sessionId }, 'Failed to save session to Redis, falling back to iron-session only');
      }

      // Update iron-session (minimal data)
      session.sessionId = sessionId;
      session.token = token;
      session.isAuthenticated = authenticated;
      session.apiCookieHash = newApiCookieHash;

      // Forward ADS cookie
      res.cookies.set(process.env.ADS_SESSION_COOKIE_NAME, sessionCookieValue);

      await session.save();
      log.debug({ sessionId }, 'Saved session to Redis and iron-session');
    } else {
      log.warn({ sessionId }, 'Token validation failed after bootstrap');
    }
  } catch (err) {
    log.error({ err }, 'Error in Redis session initialization, falling back to iron-session');
    // Fall back to iron-session only
    throw err;
  }
};

/**
 * Initialize session using iron-session only (legacy mode)
 */
const initSessionWithIronSession = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
  const apiCookieHash = await hash(adsSessionCookie);

  log.debug('Incoming session found, validating...');

  // Check if the session is valid
  const isUserIdentifiedAsBot = session.bot && isValidToken(session.token);
  const hasRefreshTokenHeader = req.headers.has('x-refresh-token');
  const isTokenValid = isValidToken(session.token);
  const isApiCookieHashPresent = apiCookieHash !== null;
  const isApiCookieHashMatching = apiCookieHash === session.apiCookieHash;

  const isValidSession =
    isUserIdentifiedAsBot ||
    (!hasRefreshTokenHeader && isTokenValid && isApiCookieHashPresent && isApiCookieHashMatching);

  if (isValidSession) {
    log.debug('Session is valid.');
    return res;
  }

  log.debug('Session is invalid, or expired, creating new one...');

  // check if the user is a bot
  await botCheck(req, res);

  // bootstrap a new token, passing in the current session cookie value
  const { token, headers } = (await bootstrap(adsSessionCookie)) ?? {};

  // validate token, update session, forward cookies
  if (isValidToken(token)) {
    log.debug('Refreshed token is valid');
    session.token = token;
    session.isAuthenticated = isAuthenticated(token);
    const sessionCookieValue = setCookie.parse(headers.get('set-cookie') ?? '')[0]?.value;
    res.cookies.set(process.env.ADS_SESSION_COOKIE_NAME, sessionCookieValue);
    session.apiCookieHash = await hash(res.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value);
    await session.save();
    log.debug('Saved to session');
  }
};

/**
 * Middleware to initialize the session
 * Supports both Redis and iron-session backends based on feature flags
 * @param req
 * @param res
 * @param session
 */
export const initSession = async (req: NextRequest, res: NextResponse, session: IronSession) => {
  const useRedis = shouldUseRedisSessions(session.sessionId as string);

  if (FeatureFlags.VERBOSE_SESSION_LOGGING) {
    log.debug({ useRedis, sessionId: session.sessionId }, 'Initializing session');
  }

  try {
    if (useRedis) {
      return await initSessionWithRedis(req, res, session);
    } else {
      return await initSessionWithIronSession(req, res, session);
    }
  } catch (err) {
    log.error({ err, useRedis }, 'Session initialization failed');
    if (useRedis) {
      try {
        log.warn('Attempting fallback to iron-session');
        return await initSessionWithIronSession(req, res, session);
      } catch (fallbackErr) {
        log.error({ err: fallbackErr }, 'Fallback to iron-session also failed');
        return res;
      }
    }
    log.error({ err }, 'Critical: Iron-session initialization failed');
    return res;
  }
};

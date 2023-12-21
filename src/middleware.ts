// eslint-disable-next-line @next/next/no-server-import-in-page
import type { NextRequest } from 'next/server';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextResponse } from 'next/server';
import { getIronSession } from 'iron-session/edge';
import { equals } from 'ramda';
import { sessionConfig } from '@config';
import { handleVerifyResponse } from '@__middleware/verify';
import { handleResponse } from '@__middleware/response';
import { bootstrap, hashSessionToken, isAuthenticated, isValidToken, redirect } from '@__middleware/common';

/**
 * Middleware for handling authentication and authorization.
 *
 * @param {NextRequest} req - The incoming request object.
 */
export async function middleware(req: NextRequest) {
  // get the current session
  const res = NextResponse.next();
  const session = await getIronSession(req, res, sessionConfig);
  const adsSessionCookie = req.cookies.get(process.env.ADS_SESSION_COOKIE_NAME)?.value;
  const apiCookieHash = await hashSessionToken(adsSessionCookie);
  const refresh = req.headers.has('x-RefreshToken');
  const url = req.nextUrl.clone();

  if (process.env.NODE_ENV === 'development') {
    console.log('[MIDDLEWARE]', req.nextUrl.href);
    console.log('session', session);
    console.log('incomingSessionCookie', adsSessionCookie);
    console.log('apiCookieHash', apiCookieHash);
    console.log('refresh', refresh);
  }

  // verify requests need to be handled separately
  if (req.nextUrl.pathname.startsWith('/user/account/verify')) {
    return handleVerifyResponse(req, res, session);
  }

  if (req.nextUrl.pathname.startsWith('/__/out')) {
    session.destroy();
    return redirect({
      url,
      res,
      path: '/',
      notifyID: 'logout-success',
    });
  }

  // check if the token held in the session is valid, and the request has a session
  if (
    !refresh &&
    isValidToken(session.token) &&
    // check if the cookie hash matches the one in the session
    apiCookieHash !== null &&
    equals(apiCookieHash, session.apiCookieHash)
  ) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[VALID]: reusing session');
    }
    return handleResponse(req, res, session);
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('[INVALID]: bootstrapping');
  }

  // bootstrap a new token, passing in the current session cookie value
  const { token, headers } = (await bootstrap(adsSessionCookie)) ?? {};

  // validate token, update session, forward cookies
  if (isValidToken(token)) {
    session.token = token;
    session.isAuthenticated = isAuthenticated(token);
    session.apiCookieHash = await hashSessionToken(
      // grab only the value of the cookie, not the name or the metadata
      headers
        .get('set-cookie')
        .slice(process.env.ADS_SESSION_COOKIE_NAME.length + 1)
        .split(';')[0],
    );
    res.headers.set('set-cookie', headers.get('set-cookie'));
    await session.save();

    return handleResponse(req, res, session);
  }

  // if bootstrapping fails, we should probably redirect back to root and show a message
  return redirect({
    url,
    res,
    path: '/',
    notifyID: 'api-connect-failed',
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon|android|images|mockServiceWorker|site.webmanifest).*)',
    '/api/user',
    '/',
  ],
};

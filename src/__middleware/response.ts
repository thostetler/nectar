// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextRequest, NextResponse } from 'next/server';
import { IronSession } from 'iron-session';
import { isAuthenticated } from './common';
import { NextURL } from 'next/dist/server/web/next-url';
import { URLSearchParams } from 'next/dist/compiled/@edge-runtime/primitives/url';
import { PROTECTED_PATHS } from '@config';

const ROUTES = {
  LOGIN: '/user/account/login',
  SETTINGS: '/user/settings',
  LIBRARIES: '/user/libraries',
  HOME: '/',
} as const;

const REDIRECT_PARAM_NAME = 'next' as const;
const VALID_REDIRECT_PATHS = [ROUTES.LIBRARIES, ROUTES.SETTINGS] as const;

/**
 * Handles the response for a given request.
 *
 * @param {NextRequest} req - The incoming request object.
 * @param {NextResponse} res - The outgoing response object.
 * @param {IronSession} session - The session object containing user session data.
 * @returns {NextResponse} - The modified response object.
 */
export const handleResponse = (req: NextRequest, res: NextResponse, session: IronSession): NextResponse => {
  const pathname = req.nextUrl.pathname;
  const authenticated = isAuthenticated(session.token);
  const url = req.nextUrl.clone();
  const explicitRedirect = getDecodedRedirect(url);
  const routeIs = checkPrefix(pathname);

  console.log('request', {
    url,
    authenticated,
    redirectUrl: explicitRedirect,
    isLogin: routeIs(ROUTES.LOGIN),
  });

  // always remove the redirect param
  url.searchParams.delete(REDIRECT_PARAM_NAME);

  // if there is a redirect URL, and it is valid, and the user has access to it, then redirect
  if (explicitRedirect && !routeIs(ROUTES.LOGIN)) {
    console.log('redirecting to', explicitRedirect);
    url.pathname = explicitRedirect;
    return NextResponse.redirect(url, { status: 307, ...res });
  }

  // if the user is authenticated and trying to access the login page, then redirect to home
  if (authenticated && routeIs(ROUTES.LOGIN)) {
    console.log('redirecting to home');
    url.pathname = ROUTES.HOME;
    return NextResponse.redirect(url, { status: 307, ...res });
  }

  // if the user is not authenticated and trying to access a protected page, then redirect to login
  if (!authenticated && PROTECTED_PATHS.some(routeIs)) {
    console.log('not authenticated, redirecting to login');
    url.pathname = ROUTES.LOGIN;
    if (VALID_REDIRECT_PATHS.some(routeIs)) {
      url.searchParams.set(REDIRECT_PARAM_NAME, encodeURIComponent(pathname));
    }
    return NextResponse.redirect(url, { status: 307, ...res });
  }

  console.log('no redirect, returning response');
  return res;
};

/**
 * Determines whether the given route string starts with the specified prefix.
 * @param {string} route - The route string to check.
 * @returns {Function} A function that takes a prefix string and returns a boolean indicating whether the route starts with the prefix.
 */
const checkPrefix =
  (route: string): ((prefix: string) => boolean) =>
  (prefix: string) =>
    route.startsWith(prefix, 0);

/**
 * Retrieves the redirect URI from the provided URL object.
 * If not present, or invalid then will redirect to root ('/')
 *
 * @param {NextURL} url - The URL object containing the redirect URI.
 *
 * @returns {string | null} The relative redirect URI, or null if the provided URL is not valid or the redirectURI is not present or not relative.
 */
const getDecodedRedirect = (url: NextURL): string | null => {
  if (url.searchParams instanceof URLSearchParams && !url?.searchParams.has(REDIRECT_PARAM_NAME)) {
    return null;
  }

  const decodedRedirect = decodeURIComponent(url.searchParams.get(REDIRECT_PARAM_NAME) ?? '');

  return VALID_REDIRECT_PATHS.some(checkPrefix(decodedRedirect)) ? decodedRedirect : null;
};

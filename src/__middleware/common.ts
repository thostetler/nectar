import { ApiTargets } from '../api/models';
import { IBootstrapPayload, IUserData } from '../api/user/types';
import { isNil, pick } from 'ramda';
import { isPast, parseISO } from 'date-fns';
// eslint-disable-next-line @next/next/no-server-import-in-page
import { NextResponse } from 'next/server';

/**
 * Check if the given userData is of type IUserData.
 *
 * @param {IUserData} userData - The userData object to be checked.
 * @returns {boolean} - Returns true if the userData is of type IUserData, otherwise false.
 */
const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

/**
 * Check if a token is valid.
 *
 * @param {IUserData} [userData] - The user data containing the token information.
 * @returns {boolean} Returns true if the token is valid, otherwise false.
 */
export const isValidToken = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
};

/**
 * Checks if the user is authenticated.
 *
 * @param {IUserData} user - The user data object.
 * @returns {boolean} - True if the user is authenticated, false otherwise.
 */
export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

/**
 * Hashes a session token using the SHA-1 algorithm.
 *
 * @param {string} sessionToken - The session token to hash.
 * @returns {Promise<Array<number>>} - A promise that resolves to an array of numbers representing the hashed session token. Returns null if the session token is not provided or an error
 * occurs during hashing.
 */
export const hashSessionToken = async (sessionToken?: string) => {
  if (!sessionToken) {
    return null;
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(sessionToken, 'utf-8'));
    return Array.from(new Uint8Array(buffer));
  } catch (e) {
    return null;
  }
};

/**
 * Asynchronously performs the bootstrap process.
 * This function retrieves the bootstrap data from the server, including the session token and headers.
 * If API mocking is enabled, it returns mocked data.
 *
 * @param {string} cookie - Optional session cookie value to be used for the bootstrap process.
 * @returns {Promise<object|null>} - A promise that resolves to an object containing the token and headers if successful, or null if an error occurred.
 */
export const bootstrap = async (cookie?: string) => {
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return {
      token: {
        access_token: 'mocked',
        username: 'mocked',
        anonymous: false,
        expire_in: 'mocked',
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
    const res = await fetch(url, {
      method: 'GET',
      headers,
    });
    const json = (await res.json()) as IBootstrapPayload;
    return {
      token: pick(['access_token', 'username', 'anonymous', 'expire_in'], json) as IUserData,
      headers: res.headers,
    };
  } catch (e) {
    return null;
  }
};

/**
 * Redirects the response to the specified URL and path.
 *
 * @param {Object} redirectParams - The redirect parameters.
 * @param {NextResponse} redirectParams.res - The original response object.
 * @param {URL} redirectParams.url - The URL to redirect to.
 * @param {string} [redirectParams.path='/'] - The path to append to the URL.
 * @param {ResponseInit} [redirectParams.options] - Additional options for the response.
 * @param {string} [redirectParams.notifyID] - The ID of the notification.
 *
 * @returns {NextResponse} The response object after redirecting.
 */
export const redirect = ({
  res,
  url,
  path = '/',
  options,
  notifyID,
}: {
  res: NextResponse;
  url: URL;
  path: string;
  options?: ResponseInit;
  notifyID?: string;
}): NextResponse => {
  if (res instanceof NextResponse && url instanceof URL && typeof path === 'string') {
    url.pathname = path;

    if (typeof notifyID === 'string') {
      url.searchParams.set('notify', notifyID);
    }

    return NextResponse.redirect(url, { status: 307, ...res, ...options });
  }
  return res;
};

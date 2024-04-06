import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
import { defaultRequestConfig } from '@/api/config';
import { isNil } from 'ramda';
import { isFuture, isPast, parseISO } from 'date-fns';
import { APP_DEFAULTS } from '@/config';
import { IBootstrapPayload, ICSRFResponse, IUserData } from '@/api/user';
import { ApiTargets } from '@/api/models';
import { ApiRequestConfig } from '@/api/api';

const fetchCSRF = async () =>
  await axios.get<ICSRFResponse, AxiosResponse<ICSRFResponse>>(ApiTargets.CSRF, {
    ...defaultRequestConfig,
    timeout: APP_DEFAULTS.API_TIMEOUT,
  });

export const configWithCSRF = async (config: ApiRequestConfig): Promise<ApiRequestConfig> => {
  const csrfRes = await fetchCSRF();
  return {
    ...config,
    xsrfHeaderName: 'X-CSRFToken',
    headers: {
      ...config.headers,
      'X-CSRFToken': csrfRes.data.csrf,
      Cookie: csrfRes.headers['set-cookie'],
    },
  };
};

/**
 * Fetches the user data from the server
 *
 * i.e. Bootstrap
 */
export const fetchUserData = async (additionalConfig?: AxiosRequestConfig) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    timeout: APP_DEFAULTS.API_TIMEOUT,
    ...additionalConfig,
    headers: {
      ...defaultRequestConfig?.headers,
      ...additionalConfig?.headers,
    },
    method: 'GET',
    url: ApiTargets.BOOTSTRAP,
  };

  return await axios.request<IBootstrapPayload, AxiosResponse<IBootstrapPayload>>(config);
};

/**
 * Hashes a string using SHA-1
 * @param str
 */
export const hash = async (str?: string) => {
  if (!str) {
    return null;
  }
  try {
    const buffer = await globalThis.crypto.subtle.digest('SHA-1', Buffer.from(str, 'utf-8'));
    return Array.from(new Uint8Array(buffer)).toString();
  } catch (e) {
    return null;
  }
};

/**
 * Checks if the user data is valid
 * @param userData
 */
export const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

export const isValidApiToken = (apiToken: string, expireAt: string) => {
  return (
    typeof apiToken === 'string' && typeof expireAt === 'string' && apiToken.length > 0 && isFuture(parseISO(expireAt))
  );
};

/**
 * Checks if the user data is valid and the token is not expired
 * @param userData
 */
export const isValidToken = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
};

/**
 * Picks the user data from the bootstrap payload
 * @param userData
 */
export const pickUserData = (userData?: IUserData) => {
  if (!isUserData(userData)) {
    return null;
  }
  return {
    access_token: userData.access_token,
    expire_in: userData.expire_in,
    username: userData.username,
    anonymous: userData.anonymous,
  };
};

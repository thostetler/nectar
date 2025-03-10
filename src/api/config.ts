import { AxiosRequestConfig } from 'axios';
import qs from 'qs';
import { APP_DEFAULTS } from '@/config';

/**
 * Figure out which config to pick, based on the current environment
 */
const resolveApiBaseUrl = (defaultBaseUrl = '/v1'): string => {
  // for mocking requests, just shortcut the baseURL here
  if (process.env.NEXT_PUBLIC_API_MOCKING === 'enabled') {
    return 'http://localhost';
  }
  return process.env.NEXT_PUBLIC_API_PATH ?? defaultBaseUrl;
};

export const defaultRequestConfig: AxiosRequestConfig = {
  baseURL: resolveApiBaseUrl(),
  withCredentials: true,
  timeout: typeof window === 'undefined' ? APP_DEFAULTS.SSR_API_TIMEOUT : APP_DEFAULTS.API_TIMEOUT,
  paramsSerializer: {
    serialize: (params) =>
      qs.stringify(params, {
        indices: false,
        arrayFormat: 'repeat',
        format: 'RFC1738',
        sort: (a, b) => a - b,
        skipNulls: true,
      }),
  },
};

export const getDynamicConfig = () => {
  return {
    ...defaultRequestConfig,
    baseURL: resolveApiBaseUrl(),
  };
};

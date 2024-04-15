import { IUserData } from '@/api/user/types';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { identity, isNil } from 'ramda';
import { defaultRequestConfig } from './config';
import { buildStorage, CacheOptions, setupCache, StorageValue } from 'axios-cache-interceptor';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';
import { getForwardedHeaders } from '@/auth';
import { RequestHeaders } from 'request-ip';
import { GetServerSidePropsContext } from 'next';

export const isUserData = (userData?: IUserData): userData is IUserData => {
  return (
    !isNil(userData) &&
    typeof userData.access_token === 'string' &&
    typeof userData.expire_in === 'string' &&
    userData.access_token.length > 0 &&
    userData.expire_in.length > 0
  );
};

export const isAuthenticated = (user: IUserData) =>
  isUserData(user) && (!user.anonymous || user.username !== 'anonymous@ads');

export const checkUserData = (userData?: IUserData): boolean => {
  return isUserData(userData) && !isPast(parseISO(userData.expire_in));
};

/**
 * Reads the current user data from localStorage
 *
 * @returns IUserData
 */
// const checkLocalStorageForUserData = (): IUserData => {
//   // attempt to read the user data from localStorage
//   try {
//     const {
//       state: { user },
//     } = JSON.parse(localStorage.getItem(APP_STORAGE_KEY)) as { state: { user: IUserData } };
//     return user;
//   } catch (e) {
//     return null;
//   }
// };

export type ApiRequestConfig = AxiosRequestConfig;

const log = logger.child({}, { msgPrefix: '[api] ' });

/**
 * Api structure that wraps the axios instance
 * This allows us to manage the setting/resetting of the token
 * and to persist a particular instance over multiple requests
 */
class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private latestError: number;
  private refreshRetries: 3;

  private constructor() {
    this.service = axios.create(defaultRequestConfig);
    void this.init();
  }

  private async init() {
    this.service.interceptors.request.use((config) => {
      log.debug({ msg: 'Intercepted Request', config });
      // const hasRefreshHeader = config.headers.has('X-REFRESH');
      //
      // // server side
      // if (typeof window === 'undefined') {
      //   if (hasRefreshHeader) {
      //     try {
      //       const result = await signIn('anonymous', { redirect: false });
      //       if (result.ok) {
      //         const session = await getSession();
      //         config.headers.delete('X-REFRESH');
      //         log.debug('Logged in as anonymous user');
      //         config.headers.Authorization = `Bearer ${session.user.apiToken}`;
      //         return config;
      //       }
      //     } catch (error) {
      //       log.error({ msg: 'Failed to log in as anonymous user', error });
      //     }
      //   }
      //
      //   return Promise.resolve(config);
      // }

      // const session = await getSession({});
      //
      // // if session is available, apply token
      // if (session && !hasRefreshHeader) {
      //   return this.configWithToken(config, session.user.apiToken);
      // }
      //
      // // otherwise, we can log in as an anonymous user
      // try {
      //   const result = await signIn('anonymous', { redirect: false });
      //   if (result.ok) {
      //     const session = await getSession();
      //     config.headers.delete('X-REFRESH');
      //     log.debug('Logged in as anonymous user');
      //     config.headers.Authorization = `Bearer ${session.user.apiToken}`;
      //     return config;
      //   }
      // } catch (error) {
      //   log.error({ msg: 'Failed to log in as anonymous user', error });
      // }
      return config;
    });
    this.service.interceptors.response.use(identity, (error: AxiosError) => {
      logger.error({ msg: 'API Error', error });

      // if (error.status === HttpStatusCode.Unauthorized || error.status === HttpStatusCode.TooManyRequests) {
      //   const serializedErrorConfig = fastHashStr(JSON.stringify(error.config));
      //   if (this.latestError === serializedErrorConfig) {
      //     this.refreshRetries -= 1;
      //   }
      //   this.latestError = serializedErrorConfig;
      //   if (this.refreshRetries > 0) {
      //     logger.debug('Retrying request');
      //     error.config.headers.set('X-REFRESH');
      //     return this.service.request(error.config);
      //   }
      // }

      logger.debug('Rejecting request');
      return Promise.reject(parseAPIError(error));
    });

    const defaultCacheConfig: CacheOptions = {
      debug: (...args) => logger.debug(...args),
      cacheTakeover: false,
      cachePredicate: {
        ignoreUrls: [/^(?!\/search\/)/],
      },
    };
    if (typeof window !== 'undefined') {
      try {
        const idb = await import('idb-keyval');
        const storage = buildStorage({
          async find(key) {
            const value = await idb.get<string>(key);
            if (!value) {
              return;
            }
            return JSON.parse(value) as StorageValue;
          },
          async set(key, value) {
            await idb.set(key, JSON.stringify(value));
          },
          async remove(key) {
            await idb.del(key);
          },
        });

        setupCache(this.service, { ...defaultCacheConfig, storage });
      } catch (error) {
        log.error({ msg: 'Error creating cache interceptor', error });
      }
    } else {
      // try {
      //   const redis = (await import('@/redis')).createRedisInstance();
      //   const storage = buildStorage({
      //     async find(key) {
      //       try {
      //         const value = await redis.get(`axios-cache-${key}`);
      //         if (!value) {
      //           return;
      //         }
      //         return JSON.parse(value) as StorageValue;
      //       } catch (error) {
      //         log.error({ msg: 'Error fetching result from Redis store', error });
      //       }
      //     },
      //     async set(key, value, req) {
      //       const isLoadingTTL = Date.now() + (req?.cache && typeof req.cache.ttl === 'number' ? req.cache.ttl : 60000);
      //       const ttl =
      //         value.state === 'loading'
      //           ? isLoadingTTL
      //           : (value.state === 'stale' && value.ttl) || (value.state === 'cached' && !canStale(value))
      //           ? value.createdAt + value.ttl
      //           : undefined;
      //
      //       try {
      //         await redis.set(`axios-cache-${key}`, JSON.stringify(value), 'PXAT', ttl);
      //       } catch (error) {
      //         log.error({ msg: 'Error setting result in Redis store', error });
      //       }
      //     },
      //     async remove(key) {
      //       try {
      //         await redis.del(`axios-cache-${key}`);
      //       } catch (error) {
      //         log.error({ msg: 'Error deleting entry in Redis store', error });
      //       }
      //     },
      //   });
      //   setupCache(this.service, { ...defaultCacheConfig, storage });
      // } catch (error) {
      //   log.error({ msg: 'Error creating cache interceptor', error });
      // }
    }
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  /**
   * Main request method
   * Authenticate and fire the request
   */
  async request<T>(config: ApiRequestConfig): Promise<AxiosResponse<T>> {
    log.debug({
      msg: 'API Request',
      config,
    });
    return this.service.request<T>(config);
  }

  async ssrRequest<T>(
    config: ApiRequestConfig,
    options: { token: string; req: GetServerSidePropsContext['req'] },
  ): Promise<AxiosResponse<T>> {
    log.debug({
      msg: 'ServerSide API Request',
      config,
    });

    return this.service.request<T>(this.configWithToken(config, options.token, options.req?.headers));
  }

  private configWithToken<T extends ApiRequestConfig>(
    config: T,
    token: string,
    additionalHeaders: RequestHeaders = {},
  ): T {
    return {
      ...config,
      headers: {
        ...config.headers,
        ...getForwardedHeaders(additionalHeaders),
        Authorization: `Bearer ${token}`,
      },
    };
  }

  public reset() {
    this.service = this.service = axios.create(defaultRequestConfig);
    void this.init();
  }
}

export default Api.getInstance();

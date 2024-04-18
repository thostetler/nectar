import { IUserData } from '@/api/user/types';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, HttpStatusCode } from 'axios';
import { identity, isNil, pick } from 'ramda';
import { defaultRequestConfig } from './config';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';
import { QueryClient } from '@tanstack/react-query';
import { AuthSession } from '@/pages/api/auth/session';
import { NoSession } from '@/error';
import { getForwardedHeaders } from '@/auth';
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

export type ApiRequestConfig = AxiosRequestConfig;

const log = logger.child({}, { msgPrefix: '[api] ' });

const sessionValue = pick(['auth', 'user']);
export const fetchSession = async () => {
  const { data } = await axios.get<AuthSession>('/api/auth/session');

  logger.debug({ msg: 'Session data', data });
  if (data?.isOk) {
    return sessionValue(data);
  } else if (data?.error === 'NoSession') {
    return await refetchSession();
  }
  throw new NoSession();
};

export const refetchSession = async () => {
  const { data, status } = await axios.post<AuthSession>('/api/auth/session');

  logger.debug({ msg: 'Session data', data });
  if (status === HttpStatusCode.Ok && data?.isOk) {
    return sessionValue(data);
  }
  throw new NoSession();
};

/**
 * Api structure that wraps the axios instance
 * This allows us to manage the setting/resetting of the token
 * and to persist a particular instance over multiple requests
 */
class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private session: AuthSession;
  private queryClient: QueryClient;

  private constructor() {
    this.service = axios.create(defaultRequestConfig);
    void this.init();
    logger.debug({ msg: 'Api', api: this });
  }

  public setQueryClient(queryClient: QueryClient) {
    this.queryClient = queryClient;
  }

  private async init() {
    try {
      if (this.queryClient instanceof QueryClient) {
        this.session = await this.queryClient.ensureQueryData({
          queryKey: ['session'],
          queryFn: fetchSession,
          retry: false,
          gcTime: 24 * 60 * 60 * 1000, // 24 hours
        });
      }
    } catch (error) {
      log.error({ msg: 'Error fetching session', error });
    }

    this.service.interceptors.request.use(async (config) => {
      if (typeof window === 'undefined') {
        return config;
      }

      log.debug({ msg: 'Intercepted Request', config });

      if (!this.session) {
        try {
          this.session = await this.queryClient.ensureQueryData({
            queryKey: ['session'],
            queryFn: fetchSession,
            retry: false,
            gcTime: 24 * 60 * 60 * 1000, // 24 hours
          });
        } catch (error) {
          log.error({ msg: 'Error fetching session', error });
        }
      }

      if (this.session && config) {
        config.headers.Authorization = `Bearer ${this.session.auth.apiToken}`;
      }

      return config;
    });

    this.service.interceptors.response.use(identity, async (error: AxiosError) => {
      logger.error({ msg: 'API Error', error });

      if (error.response?.status === HttpStatusCode.Unauthorized) {
        if (window === undefined) {
          const { data: session } = await axios.post<AuthSession>('/api/auth/session');

          if (session?.auth?.apiToken && error.config) {
            error.config.headers.Authorization = `Bearer ${session.auth.apiToken}`;
            return this.service.request(error.config);
          }
        } else {
          const session = await this.queryClient.fetchQuery({
            queryKey: ['session'],
            queryFn: refetchSession,
          });

          if (session?.auth?.apiToken && error.config) {
            error.config.headers.Authorization = `Bearer ${session.auth.apiToken}`;
            return this.service.request(error.config);
          }
        }
      }

      logger.debug('Rejecting request');
      return Promise.reject(parseAPIError(error));
    });

    if (typeof window === 'undefined') {
      return;
    }

    // const defaultCacheConfig: CacheOptions = {
    //   debug: (...args) => logger.debug(...args),
    //   cacheTakeover: false,
    //   cachePredicate: {
    //     ignoreUrls: [/^(?!\/search\/)/],
    //   },
    // };
    // try {
    //   const idb = await import('idb-keyval');
    //   const storage = buildStorage({
    //     async find(key) {
    //       const value = await idb.get<string>(key);
    //       if (!value) {
    //         return;
    //       }
    //       return JSON.parse(value) as StorageValue;
    //     },
    //     async set(key, value) {
    //       await idb.set(key, JSON.stringify(value));
    //     },
    //     async remove(key) {
    //       await idb.del(key);
    //     },
    //   });
    //
    //   setupCache(this.service, { ...defaultCacheConfig, storage });
    // } catch (error) {
    //   log.error({ msg: 'Error creating cache interceptor', error });
    // }
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
    if (typeof window === 'undefined') {
      return Promise.reject(new Error('This API client is not supported on the server'));
    }

    log.debug({
      msg: 'API Request from client',
      config,
    });

    return this.service.request<T>(config);
  }

  async ssrRequest<T>(
    config: ApiRequestConfig,
    options: {
      token: string;
      headers: GetServerSidePropsContext['req']['headers'];
    },
  ): Promise<AxiosResponse<T>> {

    if (typeof window !== 'undefined') {
      return Promise.reject(new Error('This API client is not supported on the client'));
    }

    config.headers = {
      ...config.headers,
      Authorization: `Bearer ${options.token}`,
      ...getForwardedHeaders(options.headers),
    };

    log.debug({
      msg: 'API Request from Server',
      config,
    });
    return this.service.request<T>(config);
  }

  public reset() {
    this.service = this.service = axios.create(defaultRequestConfig);
    void this.init();
  }
}

export default Api.getInstance();

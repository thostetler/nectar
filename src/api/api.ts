import { IUserData } from '@/api';
import { APP_STORAGE_KEY, updateAppUser } from '@/store';
import axios, { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { isPast, parseISO } from 'date-fns';
import { identity, isNil } from 'ramda';
import { defaultRequestConfig } from './config';
import { logger } from '@/logger';
import { buildStorage, CacheOptions, setupCache, StorageValue } from 'axios-cache-interceptor';
import { TokenResponse } from '@/pages/api/token/refresh';

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
const checkLocalStorageForUserData = (): IUserData => {
  // attempt to read the user data from localStorage
  try {
    const {
      state: { user },
    } = JSON.parse(localStorage.getItem(APP_STORAGE_KEY)) as { state: { user: IUserData } };
    return user;
  } catch (e) {
    return null;
  }
};

/**
 * Apply a bearer token string to the request's headers
 * returns a new request config with authorization header added
 */
const applyTokenToRequest = (request: ApiRequestConfig, token: string): ApiRequestConfig => {
  return {
    ...request,
    headers: {
      ...request.headers,
      authorization: `Bearer ${token}`,
    },
  };
};

export type ApiRequestConfig = AxiosRequestConfig;

enum API_STATUS {
  UNAUTHORIZED = 401,
}

const log = logger.child({}, { msgPrefix: '[api] ' });

const getClientSideCacheConfig = async () => {
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

  const config: CacheOptions = {
    debug: log.debug,
    cacheTakeover: false,
    cachePredicate: {
      ignoreUrls: [/^(?!\/search\/)/],
    },
    storage,
  };

  return config;
};

/**
 * Api structure that wraps the axios instance
 * This allows us to manage the setting/resetting of the token
 * and to persist a particular instance over multiple requests
 */
class Api {
  private static instance: Api;
  private service: AxiosInstance;
  private userData: IUserData;
  private recentError: { status: number; config: AxiosRequestConfig };

  private constructor() {
    this.service = axios.create(defaultRequestConfig);
    void this.init();
  }

  private async init() {
    this.service.interceptors.response.use(identity, (error: AxiosError & { canRefresh: boolean }) => {
      log.error(error);
      if (axios.isAxiosError(error)) {
        // if the server never responded, there won't be a response object -- in that case, reject immediately
        // this is important for SSR, just fail fast
        if (!error.response || typeof window === 'undefined') {
          return Promise.reject(error);
        }

        // check if the incoming error is the exact same status and URL as the last request
        // if so, we should reject to keep from getting into a loop
        if (
          this.recentError &&
          this.recentError.status === error.response.status &&
          this.recentError.config.url === error.config.url
        ) {
          // clear the recent error
          this.recentError = null;
          log.debug({ msg: 'Rejecting request due to recent error', err: error });
          return Promise.reject(error);
        }

        // if request is NOT bootstrap, store error config
        if (error.config.url !== '/api/user') {
          this.recentError = { status: error.response.status, config: error.config };
        }

        if (error.response.status === API_STATUS.UNAUTHORIZED) {
          this.invalidateUserData();

          log.debug({ msg: 'Unauthorized request, refreshing token and retrying', err: error });

          // retry the request
          return this.request(error.config as ApiRequestConfig);
        }
      }
      return Promise.reject(error);
    });

    // setup clientside caching
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        setupCache(this.service, await getClientSideCacheConfig());
      } catch (error) {
        log.error({
          msg: 'Client-side cache not created.',
          error,
        });
      }
    }
  }

  public static getInstance(): Api {
    if (!Api.instance) {
      Api.instance = new Api();
    }
    return Api.instance;
  }

  public setUserData(userData: IUserData) {
    if (isUserData(userData)) {
      this.userData = userData;
    }
  }

  private invalidateUserData() {
    updateAppUser(null);
    this.userData = null;
  }

  /**
   *  Try all our possible ways of getting the user data (api access token)
   */
  private async getUserData() {
    // first check if the userData we have is good
    if (checkUserData(this.userData)) {
      return this.userData;
    }

    // check local storage, could have been loaded via SSR
    const localStorageUD = checkLocalStorageForUserData();
    if (checkUserData(localStorageUD)) {
      this.setUserData(localStorageUD);
      return localStorageUD;
    }

    // fetch the userdata from the session (server api call)
    const sessionUD = await this.fetchUserData();
    if (checkUserData(sessionUD)) {
      this.setUserData(sessionUD);
      return sessionUD
    }

    // refresh the token directly
    const freshUD = await this.refreshUserData();
    if (checkUserData(freshUD)) {
      this.setUserData(freshUD);
      return freshUD
    }

    const err = new Error('Unable to obtain access to API, please try again later');
    log.error({ err }, 'Could not find or refresh user data');
    throw err;
  }

  /**
   * Main request method
   * Authenticate and fire the request
   */
  async request<T>(config: ApiRequestConfig): Promise<AxiosResponse<T>> {
    if (process.env.NODE_ENV === 'development') {
      log.info({
        msg: 'API Request',
        config,
        userData: this.userData,
      });
    }

    let ud;
    try {
      ud = await this.getUserData();
    } catch (err) {
      log.error({ err }, 'API request error, unable to fetch api access');
      return Promise.reject(err);
    }

    return this.service.request<T>(applyTokenToRequest(config, ud.access_token));
  }

  async fetchUserData() {
    const { data } = await axios.get<TokenResponse>('/api/token');
    log.debug({ msg: 'Fetching user data', data });
    return data.user;
  }

  async refreshUserData() {
    const { data } = await axios.post<TokenResponse>('/api/token/refresh');
    log.debug({ msg: 'Refreshing user data', data });
    return data.user;
  }

  public reset() {
    this.service = this.service = axios.create(defaultRequestConfig);
    void this.init();
    this.userData = null;
    this.recentError = null;
  }
}

export default Api.getInstance();

import api, { ApiTargets, ICSRFResponse, ILogoutResponse, isAuthenticated, IUserLoginResponse } from '@api';
import { defaultRequestConfig } from '@api/config';
import { useToast } from '@chakra-ui/react';
import { AppState, useStore, useStoreApi } from '@store';
import axios, { AxiosRequestConfig } from 'axios';
import { useRouter } from 'next/router';
import { useMemo } from 'react';

const getCSRF = async () => {
  const { data } = await axios.get<ICSRFResponse>(ApiTargets.CSRF, defaultRequestConfig);
  return data.csrf;
};

type Creds = { email: string; password: string; csrf: string };
const authorizeUser = async (creds: Creds) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    url: ApiTargets.USER,
    method: 'POST',
    data: {
      username: creds.email,
      password: creds.password,
    },
    xsrfCookieName: 'X-CSRFToken',
    headers: {
      'X-CSRFToken': creds.csrf,
    },
  };

  try {
    const { data } = await axios.request<IUserLoginResponse>(config);

    console.log('data', data);

    return data.message === 'success';
  } catch (e) {
    if (axios.isAxiosError(e)) {
      return (e.response.data as IUserLoginResponse).error;
    }
    return false;
  }
};

const getVaultData = async () => {
  const { data } = await api.request<Record<string, unknown>>({ url: ApiTargets.USER_DATA });
  return data;
};

const logoutUser = async (csrf: string) => {
  const config: AxiosRequestConfig = {
    ...defaultRequestConfig,
    url: ApiTargets.LOGOUT,
    method: 'POST',
    xsrfCookieName: 'X-CSRFToken',
    headers: {
      'X-CSRFToken': csrf,
    },
  };
  const { data } = await axios.request<ILogoutResponse>(config);
  if (data.message === 'success') {
    return true;
  }
  return data.error;
};

type BasicMsg<T = unknown> = {
  result?: T;
  error?: string;
  ok: boolean;
};

const userSelector = (store: AppState) => store.user;
export const useSession = () => {
  const storeApi = useStoreApi();
  const router = useRouter();
  const toast = useToast();
  const user = useStore(userSelector);
  const authenticated = useMemo(() => isAuthenticated(user), [user]);

  const reset = async () => {
    // reset the serverside session, it'll reactivate in a subsequent request
    void (await axios.post('/api/auth/reset', {}, { withCredentials: true }));

    // finally clear the store of all user data
    storeApi.getState().resetUser();

    // reset the api so it forces it to re-bootstrap
    api.reset();
  };

  const login = async (
    creds: Omit<Creds, 'csrf'>,
    options: { redirectUri?: string } = {},
  ): Promise<BasicMsg<string> | void> => {
    const result = await authorizeUser({ ...creds, csrf: await getCSRF() });
    if (result === true) {
      try {
        // clear all user data
        await reset();

        // push vault data into the store
        const vaultData = await getVaultData();
        storeApi.setState({ userSettings: vaultData });

        // redirect to the redirect URI
        // TODO: serialize a redirectUri and pull it from storage
        void router.push(options.redirectUri ?? '/', null, { shallow: false });

        // alert the user, we don't have a username at this point, so better to show a generic message
        // Why does the `user` endpoint not return user information after login
        toast({ title: `Logged in successfully!` });
        return { ok: true };
      } catch (e) {
        console.log(e);
        return { ok: false, error: 'Unable to login user' };
      }
    } else if (typeof result === 'string') {
      return { ok: false, error: result };
    }
    return { error: 'Unable to login user', ok: false };
  };

  const logout = async () => {
    const result = await logoutUser(await getCSRF());
    if (result === true) {
      // clear all user data
      await reset();

      // redirect to root
      void router.push('/', null, { shallow: false });

      // alert the user, we don't have a username at this point, so better to show a generic message
      // Why does the `user` endpoint not return user information after login
      toast({ title: `Logged out!` });
      return { ok: true };
    }
    return { error: result, ok: false };
  };

  return {
    login,
    logout,
    isAuthenticated: authenticated,
  };
};

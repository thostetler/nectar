import api, { isAuthenticated, IUserData } from '@api';
import { useBoolean } from '@chakra-ui/react';
// import { useToast } from '@chakra-ui/react';
import { AppState, useStore, useStoreApi } from '@store';
import axios from 'axios';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { getVaultData, registerUser } from './helpers';
import { BasicMsg, IUserCredentials, IUserRegistrationCredentials } from './types';

const userSelector = (store: AppState) => store.user;
export const useSession = () => {
  const storeApi = useStoreApi();
  const router = useRouter();
  // const toast = useToast();
  const user = useStore(userSelector);
  const [isLoggingIn, setIsLoggingIn] = useBoolean(false);
  const [isLoggingOut, setIsLoggingOut] = useBoolean(false);
  const [isRegistering, setIsRegistering] = useBoolean(false);
  const authenticated = useMemo(() => isAuthenticated(user), [user]);

  const login = async (creds: IUserCredentials, options: { redirectUri?: string } = {}): Promise<BasicMsg<string>> => {
    try {
      setIsLoggingIn.on();
      const { data } = await axios.post<{ success: boolean; user?: IUserData; error?: string }>(
        '/api/auth/login',
        creds,
      );
      if (data.success) {
        // clear the store of all user data (mainly to clear token)
        storeApi.getState().resetUser();
        storeApi.getState().resetUserSettings();
        api.reset();

        if (data.user) {
          // should have a good logged in user to store
          storeApi.setState({ user: data.user });
        } else {
          setIsLoggingIn.off();
          // we were logged in successfully, but the bootstrap failed on the server
          // we should fail the login, since the server will be out of sync
          return { ok: false, error: 'Problem logging in, please try again' };
        }

        // push vault data into the store
        const vaultData = await getVaultData();

        // TODO: what should happen if vault request fails here?
        // nothing probably, since we don't need it yet
        storeApi.getState().setUserSettings(vaultData ?? {});

        setIsLoggingIn.off();
        // redirect to the redirect URI
        // TODO: serialize a redirectUri and pull it from storage
        await router.push(options.redirectUri ?? (router.query.redirectUri as string) ?? '/', null, { shallow: false });

        // show message to user
        // toast({ title: `${creds.email} Logged in successfully!`, position: 'top' });
        return { ok: true };
      } else if (data.error) {
        setIsLoggingIn.off();
        return { ok: false, error: data.error };
      }
    } catch (e) {}
    setIsLoggingIn.off();
    return { error: 'Unable to login user', ok: false };
  };

  const logout = async (): Promise<BasicMsg<string>> => {
    try {
      setIsLoggingOut.on();
      const { data } = await axios.post<{ success: boolean; user?: IUserData; error?: string }>('/api/auth/logout');

      if (data.success) {
        // clear all user data
        storeApi.getState().resetUser();
        storeApi.getState().resetUserSettings();
        api.reset();

        if (data.user) {
          // should have a good logged in user to store
          storeApi.setState({ user: data.user });
        } else {
          setIsLoggingOut.off();
          // we were logged in successfully, but the bootstrap failed on the server
          // we should fail the login, since the server will be out of sync
          return { ok: false, error: 'Problem logging out, please try again' };
        }

        setIsLoggingOut.off();
        // redirect to root
        void router.push('/', null, { shallow: false });

        // show message to user
        // toast({ title: `Logged out!`, position: 'top' });
        return { ok: true };
      } else if (data.error) {
        setIsLoggingOut.off();
        return { error: data.error, ok: false };
      }
    } catch (e) {
    } finally {
      setIsLoggingOut.off();
    }

    setIsLoggingOut.off();
    return { error: 'Unable to logout user', ok: false };
  };

  const register = async (creds: IUserRegistrationCredentials): Promise<BasicMsg<string>> => {
    try {
      setIsRegistering.on();
      const result = await registerUser(creds);
      if (result === true) {
        // toast({ title: `Successfully registered! Please check your email` });
        return { ok: true };
      } else if (typeof result === 'string') {
        return { error: result, ok: false };
      }
    } catch (e) {
    } finally {
      setIsRegistering.off();
    }
    setIsRegistering.off();
    return { error: 'Unable to register user', ok: false };
  };

  return {
    login,
    logout,
    register,
    isAuthenticated: authenticated,
    isLoggingIn,
    isLoggingOut,
    isRegistering,
  };
};

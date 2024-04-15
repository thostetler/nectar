import { logger } from '@/logger';
import { useQuery } from '@tanstack/react-query';
import axios, { HttpStatusCode } from 'axios';
import { AuthSession } from '@/pages/api/auth/session';
import { pick } from 'ramda';
import { useToast } from '@chakra-ui/react';
import { useEffect } from 'react';

const PROTECTED_ROUTES = ['/user/account/settings', '/user/libraries'];
const sessionValue = pick(['auth', 'user']);

/**
 * Provides access to the user session and methods to logout
 */
export const useNectarSession = () => {
  const toast = useToast();
  const result = useQuery({
    queryKey: ['session'],
    queryFn: async () => {
      const { data } = await axios.get<AuthSession>('/api/auth/session');

      logger.debug({ msg: 'Session data', data });

      if (data.isOk) {
        return sessionValue(data);
      } else if (data.error === 'NoSession') {
        const { data, status } = await axios.post<AuthSession>('/api/auth/session');

        if (status === HttpStatusCode.Ok && data.isOk) {
          return sessionValue(data);
        }
        // TODO: what if the session is not created?
      }
      // TODO: what if the session is not ok?
    },
    retry: false,
    refetchInterval: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: true,
    cacheTime: 24 * 60 * 60 * 1000, // 24 hours
  });

  useEffect(() => {
    if (result.error) {
      logger.error({
        msg: 'Failed to get session',
        error: result.error,
      });

      toast({
        title: 'Having trouble connecting to the API, please try reloading the page.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  }, [result.error]);

  return {
    ...result,
    isAuthenticated: false,
    logout: async () => {
      try {
        return Promise.reject('Not implemented');
      } catch (error) {
        logger.error({
          msg: 'Logout failed',
          error,
        });
      }
    },
  };
};

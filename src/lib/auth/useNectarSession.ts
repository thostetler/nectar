import { logger } from '@/logger';
import { useQuery } from '@tanstack/react-query';
import axios, { HttpStatusCode } from 'axios';
import { AuthSession } from '@/pages/api/auth/session';
import { pick } from 'ramda';
import { useToast } from '@chakra-ui/react';
import { NoSession } from '@/error';
import { useEffect } from 'react';

const PROTECTED_ROUTES = ['/user/account/settings', '/user/libraries'];
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

  logger.debug({ msg: 'Refetched Session data', data });
  if (status === HttpStatusCode.Ok && data?.isOk) {
    return sessionValue(data);
  }
  throw new NoSession();
};

/**
 * Provides access to the user session and methods to logout
 */
export const useNectarSession = () => {
  const toast = useToast();

  const result = useQuery({
    queryKey: ['session'],
    queryFn: fetchSession,
    retry: false,
    keepPreviousData: true,
  });

  useEffect(() => {
    if (result.error) {
      logger.error({
        msg: 'Failed to get session',
        error: result.error,
      });

      if (!toast.isActive('session-api-error')) {
        toast({
          title: 'Having trouble connecting to the API.',
          status: 'error',
          duration: 5000,
          isClosable: true,
          id: 'session-api-error',
        });
      }
    }

    if (result.isFetching) {
      logger.debug({
        msg: 'Fetching session',
      });

      if (!toast.isActive('session-api-connecting')) {
        toast({
          title: 'Connecting to API...',
          status: 'info',
          duration: 5000,
          isClosable: true,
          id: 'session-api-connecting',
        });
      }
    }
  }, [result.error, result.isFetching]);

  return {
    ...result,
    isAuthenticated: result.isSuccess && result.data ? result.data?.auth.isAuthenticated : false,
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

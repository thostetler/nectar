import { QueryClient } from '@tanstack/react-query';
import { AuthSession } from '@/pages/api/auth/session';
import { logger } from '@/logger';
import { NoSession } from '@/error';
import { fetchSession } from '@/lib/auth/useNectarSession';

const MAX_WAIT = 10_000;
export const getClientSession = async (queryClient: QueryClient) => {
  logger.debug({ msg: 'getClientSession', queryClient });
  if (queryClient instanceof QueryClient) {
    let timeoutId: ReturnType<typeof setTimeout>;
    return new Promise<AuthSession>((resolve, reject) => {
      const check = (count = MAX_WAIT / 100) => {
        const isFetching = queryClient.isFetching(['session']);
        if (isFetching) {
          logger.debug({ queryClient, msg: 'Fetching session' });
          if (count-- === 0) {
            return reject(new Error('Timeout waiting for session'));
          }
          timeoutId = setTimeout(check, 100, count);
        }

        queryClient
          .ensureQueryData({
            queryKey: ['session'],
            queryFn: fetchSession,
          })
          .then((session) => {
            logger.debug({ msg: 'Session loaded, and found', session });
            resolve(session as AuthSession);
          })
          .catch((error: Error) => {
            logger.error({ msg: 'Session not found', error });
            reject(new NoSession());
          });

        reject(new NoSession());
      };
      check();
    }).finally(() => clearTimeout(timeoutId));
  }

  return null;
};

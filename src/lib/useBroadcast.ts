import { useCallback, useEffect, useRef } from 'react';
import { BroadcastChannel } from 'broadcast-channel';
import { QueryClient } from '@tanstack/react-query';

const USER_CHANNEL = 'nectar-user';
export const useBroadcast = (qc: QueryClient) => {
  const userChannel = useRef<BroadcastChannel>(null);
  const login = qc.isMutating({ mutationKey: ['login'] });
  const logout = qc.isMutating({ mutationKey: ['logout'] });
  console.log({ login, logout });

  const invalidateUser = useCallback(() => {
    void qc.invalidateQueries(['user']);
  }, [qc]);

  // initialize broadcast channel
  useEffect(() => {
    userChannel.current = new BroadcastChannel(USER_CHANNEL);

    userChannel.current.onmessage = ({ data: message }) => {
      console.log('message', message);
      if (message === 'invalidate-user') {
        invalidateUser();
      }
    };

    return () => {
      userChannel.current?.close().finally(() => (userChannel.current = null));
    };
  }, []);

  useEffect(() => {
    if (login > 0) {
      console.log('login', login);
    }
    if (logout > 0) {
      console.log('logout', logout);
    }
  }, [login, logout]);

  // // watch cache for invalidation
  // useEffect(() => {
  //   const cachedUser = qc.getQueryData<IUserData>(['user']);
  //   console.log('cachedUser', cachedUser);
  //   if (userChannel.current && !isUserData(cachedUser)) {
  //     console.log('invalidate-user');
  //     void userChannel.current.postMessage('invalidate-user');
  //   }
  // }, [userChannel, qc]);
};

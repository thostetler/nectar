import api, { isAuthenticated } from '@api';
import axios from 'axios';
import { useEffect } from 'react';
import { NotificationId } from '@store/slices';
import { useUser } from '@lib/useUser';
import { useMutation } from '@tanstack/react-query';
import { ILogoutResponse } from '@pages/api/auth/logout';
import { useReloadWithNotification } from '@components/Notification';

interface IUseSessionProps {
  redirectWithMessage?: NotificationId;
}

/**
 * Provides access to the user session and methods to logout
 * @param props
 */
export const useSession = (props: IUseSessionProps = { redirectWithMessage: null }) => {
  const { redirectWithMessage } = props;
  const { user, reset } = useUser();
  const reload = useReloadWithNotification();

  const { mutate: logout, ...result } = useMutation(['logout'], async () => {
    const { data } = await axios.post<ILogoutResponse>('/api/auth/logout');
    return data;
  });

  useEffect(() => {
    if (result.data?.success) {
      api.reset();
      reset().finally(() => void reload(redirectWithMessage ?? 'account-logout-success'));
    }
  }, [result.data?.success, redirectWithMessage]);

  useEffect(() => {
    if (result.isError) {
      void reload('account-logout-failed');
    }
  }, [result.isError]);

  return {
    logout,
    isAuthenticated: isAuthenticated(user),
    ...result,
  };
};
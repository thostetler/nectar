import api from '@/api/api';
import axios from 'axios';
import { useEffect } from 'react';
import { useUser } from '@/lib/useUser';
import { useMutation } from '@tanstack/react-query';
import { ILogoutResponse } from '@/pages/api/auth/logout';
import { useRouter } from 'next/compat/router';
import { isAuthenticated } from '@/auth-utils';

/**
 * Provides access to the user session and methods to logout
 */
export const useSession = () => {
  const { user, reset } = useUser();
  const router = useRouter();

  const { mutate: logout, ...result } = useMutation(['logout'], async () => {
    const { data } = await axios.post<ILogoutResponse>('/api/auth/logout');
    return data;
  });

  useEffect(() => {
    if (result.data?.success) {
      api.reset();
      reset().finally(() => {
        router.reload();
      });
    }
  }, [result.data?.success]);

  useEffect(() => {
    if (result.isError) {
      router.reload();
    }
  }, [result.isError]);

  return {
    logout,
    isAuthenticated: isAuthenticated(user),
    ...result,
  };
};

import api, { isAuthenticated } from '@/api';
import axios from 'axios';
import { useEffect } from 'react';
import { useUser } from '@/lib/useUser';
import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

/**
 * Provides access to the user session and methods to logout
 */
export const useSession = () => {
  const { user, reset } = useUser();
  const { refresh } = useRouter();

  const { mutate: logout, ...result } = useMutation(['logout'], async () => {
    const { data } = await axios.post('/api/auth/logout');
    return data;
  });

  useEffect(() => {
    if (result.data?.success) {
      api.reset();
      reset().finally(() => {
        refresh();
      });
    }
  }, [result.data?.success]);

  useEffect(() => {
    if (result.isError) {
      refresh();
    }
  }, [result.isError]);

  return {
    logout,
    isAuthenticated: isAuthenticated(user),
    ...result,
  };
};

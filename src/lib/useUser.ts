import { useStore } from '@/store';
import { useCallback, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { isUserData } from '@/auth-utils';

/**
 * Provides access to the user object and methods to reset it
 * @example
 * const { user, reset } = useUser();
 *
 * Subscribes to the user object in the store and updates the queryClient
 */
export const useUser = () => {
  const user = useStore((state) => state.user);
  const resetUser = useStore((state) => state.resetUser);
  const resetUserSettings = useStore((state) => state.resetUserSettings);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isUserData(user)) {
      queryClient.setQueryData(['user'], user);
    }
  }, [user, queryClient]);

  const reset = useCallback(async () => {
    resetUserSettings();
    resetUser();
    await queryClient.invalidateQueries(['user'], { exact: true });
  }, [queryClient, resetUser, resetUserSettings]);

  return {
    user,
    reset,
    resetUser,
    resetUserSettings,
  };
};

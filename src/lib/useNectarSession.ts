import { useSession } from 'next-auth/react';

/**
 * Provides access to the user session and methods to logout
 */
export const useNectarSession = () => {
  const { data, status } = useSession();

  return {
    isAuthenticated: status === 'authenticated' && data.user.isLoggedIn,
  };
};

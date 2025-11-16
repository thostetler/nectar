/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useUser } from '../useUser';
import { useStore } from '@/store';
import { useQueryClient } from '@tanstack/react-query';
import * as authUtils from '@/auth-utils';

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
  useQueryClient: vi.fn(),
}));

vi.mock('@/auth-utils', () => ({
  isUserData: vi.fn(),
}));

describe('useUser', () => {
  const mockUseStore = vi.mocked(useStore);
  const mockUseQueryClient = vi.mocked(useQueryClient);
  const mockIsUserData = vi.mocked(authUtils.isUserData);

  let mockQueryClient: any;
  let mockResetUser: any;
  let mockResetUserSettings: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockQueryClient = {
      setQueryData: vi.fn(),
      invalidateQueries: vi.fn().mockResolvedValue(undefined),
    };

    mockResetUser = vi.fn();
    mockResetUserSettings = vi.fn();

    mockUseQueryClient.mockReturnValue(mockQueryClient);
  });

  describe('basic functionality', () => {
    it('should return user from store', () => {
      const mockUser = { username: 'test@example.com', access_token: 'token123' };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: mockUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(true);

      const { result } = renderHook(() => useUser());

      expect(result.current.user).toBe(mockUser);
    });

    it('should return reset functions from store', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      const { result } = renderHook(() => useUser());

      expect(result.current.resetUser).toBe(mockResetUser);
      expect(result.current.resetUserSettings).toBe(mockResetUserSettings);
    });
  });

  describe('queryClient sync', () => {
    it('should set query data when user is valid', async () => {
      const mockUser = { username: 'test@example.com', access_token: 'token123' };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: mockUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(true);

      renderHook(() => useUser());

      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], mockUser);
      });
    });

    it('should not set query data when user is not valid', async () => {
      const mockUser = { invalid: 'data' };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: mockUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      renderHook(() => useUser());

      // Wait a bit to ensure effect doesn't run
      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
    });

    it('should not set query data when user is null', async () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      renderHook(() => useUser());

      await new Promise((resolve) => setTimeout(resolve, 50));

      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();
    });

    it('should update query data when user changes', async () => {
      const mockUser1 = { username: 'user1@example.com', access_token: 'token1' };
      const mockUser2 = { username: 'user2@example.com', access_token: 'token2' };

      let currentUser = mockUser1;

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: currentUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(true);

      const { rerender } = renderHook(() => useUser());

      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], mockUser1);
      });

      // Change user
      currentUser = mockUser2;
      rerender();

      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], mockUser2);
      });

      expect(mockQueryClient.setQueryData).toHaveBeenCalledTimes(2);
    });
  });

  describe('reset function', () => {
    it('should call resetUserSettings and resetUser', async () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      const { result } = renderHook(() => useUser());

      await result.current.reset();

      expect(mockResetUserSettings).toHaveBeenCalledTimes(1);
      expect(mockResetUser).toHaveBeenCalledTimes(1);
    });

    it('should invalidate user queries', async () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      const { result } = renderHook(() => useUser());

      await result.current.reset();

      expect(mockQueryClient.invalidateQueries).toHaveBeenCalledWith(['user'], { exact: true });
    });

    it('should call functions in correct order', async () => {
      const callOrder: string[] = [];

      mockResetUserSettings.mockImplementation(() => {
        callOrder.push('resetUserSettings');
      });

      mockResetUser.mockImplementation(() => {
        callOrder.push('resetUser');
      });

      mockQueryClient.invalidateQueries.mockImplementation(() => {
        callOrder.push('invalidateQueries');
        return Promise.resolve();
      });

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      const { result } = renderHook(() => useUser());

      await result.current.reset();

      expect(callOrder).toEqual(['resetUserSettings', 'resetUser', 'invalidateQueries']);
    });

    it('should return a promise that resolves when complete', async () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: null,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(false);

      const { result } = renderHook(() => useUser());

      const resetPromise = result.current.reset();

      expect(resetPromise).toBeInstanceOf(Promise);
      await expect(resetPromise).resolves.toBeUndefined();
    });
  });

  describe('edge cases', () => {
    it('should handle anonymous user', async () => {
      const mockUser = { username: 'anonymous@ads', anonymous: true, access_token: 'anon' };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: mockUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(true);

      renderHook(() => useUser());

      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], mockUser);
      });
    });

    it('should handle user with additional properties', async () => {
      const mockUser = {
        username: 'test@example.com',
        access_token: 'token123',
        extra: 'property',
        nested: { data: 'value' },
      };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: mockUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(true);

      const { result } = renderHook(() => useUser());

      expect(result.current.user).toBe(mockUser);
      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], mockUser);
      });
    });

    it('should handle transition from null to valid user', async () => {
      let currentUser: any = null;

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: currentUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });

      mockIsUserData.mockImplementation((user) => user !== null);

      const { rerender } = renderHook(() => useUser());

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(mockQueryClient.setQueryData).not.toHaveBeenCalled();

      // Set user
      currentUser = { username: 'test@example.com', access_token: 'token' };
      rerender();

      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], currentUser);
      });
    });

    it('should handle transition from valid user to null', async () => {
      let currentUser: any = { username: 'test@example.com', access_token: 'token' };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: currentUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });

      mockIsUserData.mockImplementation((user) => user !== null);

      const { rerender } = renderHook(() => useUser());

      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], currentUser);
      });

      // Clear user
      currentUser = null;
      rerender();

      // Should not call setQueryData again
      expect(mockQueryClient.setQueryData).toHaveBeenCalledTimes(1);
    });
  });

  describe('integration', () => {
    it('should work correctly with all returned values', async () => {
      const mockUser = { username: 'test@example.com', access_token: 'token123' };

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          user: mockUser,
          resetUser: mockResetUser,
          resetUserSettings: mockResetUserSettings,
        };
        return selector(state);
      });
      mockIsUserData.mockReturnValue(true);

      const { result } = renderHook(() => useUser());

      // Verify all returned values
      expect(result.current.user).toBe(mockUser);
      expect(result.current.resetUser).toBe(mockResetUser);
      expect(result.current.resetUserSettings).toBe(mockResetUserSettings);
      expect(typeof result.current.reset).toBe('function');

      // Verify queryClient sync happened
      await waitFor(() => {
        expect(mockQueryClient.setQueryData).toHaveBeenCalledWith(['user'], mockUser);
      });

      // Verify reset works
      await result.current.reset();
      expect(mockResetUser).toHaveBeenCalled();
      expect(mockResetUserSettings).toHaveBeenCalled();
      expect(mockQueryClient.invalidateQueries).toHaveBeenCalled();
    });
  });
});

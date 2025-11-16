import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGetUserEmail } from '../useGetUserEmail';
import * as store from '@/store';
import { IUserData } from '@/api/user/types';

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

describe('useGetUserEmail', () => {
  const mockUseStore = vi.mocked(store.useStore);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('authenticated users', () => {
    it('should return email for valid authenticated user', () => {
      const mockUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('user@example.com');
    });

    it('should return username even if it is not an email format', () => {
      const mockUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: 'johndoe',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('johndoe');
    });

    it('should return different usernames for different users', () => {
      const mockUser1: IUserData = {
        access_token: 'token1',
        expires_at: '9999999999',
        username: 'alice@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser1);
      const { result: result1 } = renderHook(() => useGetUserEmail());
      expect(result1.current).toBe('alice@example.com');

      const mockUser2: IUserData = {
        access_token: 'token2',
        expires_at: '9999999999',
        username: 'bob@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser2);
      const { result: result2 } = renderHook(() => useGetUserEmail());
      expect(result2.current).toBe('bob@example.com');
    });
  });

  describe('anonymous users', () => {
    it('should return null for anonymous user', () => {
      const mockUser: IUserData = {
        access_token: 'token',
        expires_at: '9999999999',
        username: 'anonymous@ads',
        anonymous: true,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should return null when anonymous flag is true even with valid email', () => {
      const mockUser: IUserData = {
        access_token: 'token',
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: true,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });
  });

  describe('invalid user data', () => {
    it('should return null when user is null', () => {
      mockUseStore.mockReturnValue(null);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should return null when user is undefined', () => {
      mockUseStore.mockReturnValue(undefined);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should return null when access_token is missing', () => {
      const invalidUser = {
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should return null when access_token is empty string', () => {
      const invalidUser: IUserData = {
        access_token: '',
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should return null when expires_at is missing', () => {
      const invalidUser = {
        access_token: 'valid-token',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should return null when expires_at is empty string', () => {
      const invalidUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(null);
    });

    it('should handle user object with missing username property', () => {
      const invalidUser = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(invalidUser);

      const { result } = renderHook(() => useGetUserEmail());
      // If username is missing, isUserData still passes but user.username is undefined
      expect(result.current).toBe(undefined);
    });
  });

  describe('edge cases', () => {
    it('should handle empty username for authenticated user', () => {
      const mockUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: '',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('');
    });

    it('should handle username with special characters', () => {
      const mockUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: 'user+tag@example.co.uk',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('user+tag@example.co.uk');
    });

    it('should handle very long username', () => {
      const longUsername = 'very.long.email.address.with.many.dots@subdomain.example.com';
      const mockUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: longUsername,
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe(longUsername);
    });

    it('should handle user data with extra properties', () => {
      const mockUser = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: false,
        extraProp: 'should be ignored',
        anotherProp: 123,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('user@example.com');
    });

    it('should handle numeric-like username', () => {
      const mockUser: IUserData = {
        access_token: 'valid-token',
        expires_at: '9999999999',
        username: '12345',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('12345');
    });
  });

  describe('reactivity', () => {
    it('should update when user changes in store', () => {
      const mockUser1: IUserData = {
        access_token: 'token1',
        expires_at: '9999999999',
        username: 'user1@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser1);

      const { result, rerender } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('user1@example.com');

      // Simulate store update
      const mockUser2: IUserData = {
        access_token: 'token2',
        expires_at: '9999999999',
        username: 'user2@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser2);
      rerender();

      expect(result.current).toBe('user2@example.com');
    });

    it('should return null when user logs out', () => {
      const mockUser: IUserData = {
        access_token: 'token',
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result, rerender } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('user@example.com');

      // Simulate logout
      mockUseStore.mockReturnValue(null);
      rerender();

      expect(result.current).toBe(null);
    });

    it('should return null when user becomes anonymous', () => {
      const mockUser: IUserData = {
        access_token: 'token',
        expires_at: '9999999999',
        username: 'user@example.com',
        anonymous: false,
      };

      mockUseStore.mockReturnValue(mockUser);

      const { result, rerender } = renderHook(() => useGetUserEmail());
      expect(result.current).toBe('user@example.com');

      // User becomes anonymous
      const anonymousUser: IUserData = {
        ...mockUser,
        anonymous: true,
      };

      mockUseStore.mockReturnValue(anonymousUser);
      rerender();

      expect(result.current).toBe(null);
    });
  });
});

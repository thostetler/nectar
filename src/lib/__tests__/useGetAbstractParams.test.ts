import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGetAbstractParams } from '../useGetAbstractParams';
import * as store from '@/store';

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

describe('useGetAbstractParams', () => {
  const mockUseStore = vi.mocked(store.useStore);

  beforeEach(() => {
    vi.clearAllMocks();
    // Default pageSize
    mockUseStore.mockReturnValue(25);
  });

  describe('basic functionality', () => {
    it('should return getParams function and onPageChange callback', () => {
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      expect(result.current).toHaveProperty('getParams');
      expect(result.current).toHaveProperty('onPageChange');
      expect(typeof result.current.getParams).toBe('function');
      expect(typeof result.current.onPageChange).toBe('function');
    });

    it('should return initial params with start 0', () => {
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      const params = result.current.getParams();
      expect(params).toEqual({
        bibcode: 'test-bibcode',
        start: 0,
      });
    });

    it('should include the correct bibcode', () => {
      const { result } = renderHook(() => useGetAbstractParams('my-bibcode-123'));

      const params = result.current.getParams();
      expect(params.bibcode).toBe('my-bibcode-123');
    });
  });

  describe('pagination', () => {
    it('should calculate start based on page and pageSize', () => {
      mockUseStore.mockReturnValue(25);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      // Change to page 1 (second page)
      act(() => {
        result.current.onPageChange(1);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(25); // 1 * 25
    });

    it('should calculate start for page 0', () => {
      mockUseStore.mockReturnValue(25);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(0);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(0); // 0 * 25
    });

    it('should calculate start for page 2', () => {
      mockUseStore.mockReturnValue(25);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(2);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(50); // 2 * 25
    });

    it('should calculate start for page 5', () => {
      mockUseStore.mockReturnValue(25);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(5);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(125); // 5 * 25
    });
  });

  describe('different page sizes', () => {
    it('should work with pageSize of 10', () => {
      mockUseStore.mockReturnValue(10);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(3);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(30); // 3 * 10
    });

    it('should work with pageSize of 50', () => {
      mockUseStore.mockReturnValue(50);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(2);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(100); // 2 * 50
    });

    it('should work with pageSize of 100', () => {
      mockUseStore.mockReturnValue(100);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(1);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(100); // 1 * 100
    });

    it('should update when pageSize changes', () => {
      mockUseStore.mockReturnValue(25);
      const { result, rerender } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(2);
      });

      expect(result.current.getParams().start).toBe(50); // 2 * 25

      // Change pageSize
      mockUseStore.mockReturnValue(50);
      rerender();

      expect(result.current.getParams().start).toBe(100); // 2 * 50
    });
  });

  describe('bibcode changes (reset behavior)', () => {
    it('should NOT reset start when bibcode stays the same', () => {
      mockUseStore.mockReturnValue(25);
      const { result, rerender } = renderHook(({ id }) => useGetAbstractParams(id), {
        initialProps: { id: 'bibcode-1' },
      });

      // Navigate to page 2
      act(() => {
        result.current.onPageChange(2);
      });

      expect(result.current.getParams().start).toBe(50);

      // Re-render with same bibcode
      rerender({ id: 'bibcode-1' });

      const params = result.current.getParams();
      expect(params.start).toBe(50); // Should NOT reset
      expect(params.bibcode).toBe('bibcode-1');
    });

    it('should include correct bibcode when id changes', () => {
      mockUseStore.mockReturnValue(25);
      const { result, rerender } = renderHook(({ id }) => useGetAbstractParams(id), {
        initialProps: { id: 'bibcode-1' },
      });

      expect(result.current.getParams().bibcode).toBe('bibcode-1');

      // Change to bibcode-2
      rerender({ id: 'bibcode-2' });
      expect(result.current.getParams().bibcode).toBe('bibcode-2');

      // Change to bibcode-3
      rerender({ id: 'bibcode-3' });
      expect(result.current.getParams().bibcode).toBe('bibcode-3');
    });
  });

  describe('edge cases', () => {
    it('should handle empty bibcode', () => {
      const { result } = renderHook(() => useGetAbstractParams(''));

      const params = result.current.getParams();
      expect(params.bibcode).toBe('');
      expect(params.start).toBe(0);
    });

    it('should handle bibcode with special characters', () => {
      const specialBibcode = '2021ApJ...123..456A/abstract';
      const { result } = renderHook(() => useGetAbstractParams(specialBibcode));

      const params = result.current.getParams();
      expect(params.bibcode).toBe(specialBibcode);
    });

    it('should handle very large page numbers', () => {
      mockUseStore.mockReturnValue(25);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(1000);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(25000); // 1000 * 25
    });

    it('should handle pageSize of 0', () => {
      mockUseStore.mockReturnValue(0);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(5);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(0); // 5 * 0 = 0
    });

    it('should handle pageSize of 1', () => {
      mockUseStore.mockReturnValue(1);
      const { result } = renderHook(() => useGetAbstractParams('test-bibcode'));

      act(() => {
        result.current.onPageChange(10);
      });

      const params = result.current.getParams();
      expect(params.start).toBe(10); // 10 * 1
    });
  });

  describe('callback stability', () => {
    it('should return stable onPageChange reference', () => {
      const { result, rerender } = renderHook(() => useGetAbstractParams('test-bibcode'));

      const firstOnPageChange = result.current.onPageChange;

      rerender();

      const secondOnPageChange = result.current.onPageChange;

      // setState functions from useState are stable
      expect(firstOnPageChange).toBe(secondOnPageChange);
    });

    it('should update getParams when dependencies change', () => {
      mockUseStore.mockReturnValue(25);
      const { result, rerender } = renderHook(({ id }) => useGetAbstractParams(id), {
        initialProps: { id: 'bibcode-1' },
      });

      const firstGetParams = result.current.getParams;

      // Change bibcode
      rerender({ id: 'bibcode-2' });

      const secondGetParams = result.current.getParams;

      // getParams should be a new function due to dependency changes
      expect(firstGetParams).not.toBe(secondGetParams);
    });
  });
});

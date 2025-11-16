/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIntermediateQuery } from '../useIntermediateQuery';
import { useStore } from '@/store';
import { useDebouncedCallback } from 'use-debounce';

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('use-debounce', () => ({
  useDebouncedCallback: vi.fn(),
}));

describe('useIntermediateQuery', () => {
  const mockUseStore = vi.mocked(useStore);
  const mockUseDebouncedCallback = vi.mocked(useDebouncedCallback);

  let mockUpdateQuery: any;
  let mockSetQueryAddition: any;
  let mockSetClearQueryFlag: any;

  beforeEach(() => {
    vi.clearAllMocks();

    mockUpdateQuery = vi.fn();
    mockSetQueryAddition = vi.fn();
    mockSetClearQueryFlag = vi.fn();

    // Default: useDebouncedCallback returns the function passed to it (no actual debouncing in tests)
    mockUseDebouncedCallback.mockImplementation((fn) => fn as any);
  });

  describe('basic functionality', () => {
    it('should return current query from store', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: 'test query' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.query).toBe('test query');
    });

    it('should return queryAddition from store', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: 'addition text',
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.queryAddition).toBe('addition text');
    });

    it('should return isClearingQuery flag from store', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: true,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.isClearingQuery).toBe(true);
    });
  });

  describe('updateQuery', () => {
    it('should call updateQuery with q parameter', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.updateQuery('new query');
      });

      expect(mockUpdateQuery).toHaveBeenCalledWith({ q: 'new query' });
    });

    it('should handle empty string query', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.updateQuery('');
      });

      expect(mockUpdateQuery).toHaveBeenCalledWith({ q: '' });
    });

    it('should handle complex query string', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.updateQuery('author:"Smith, J." year:2023 bibstem:ApJ');
      });

      expect(mockUpdateQuery).toHaveBeenCalledWith({ q: 'author:"Smith, J." year:2023 bibstem:ApJ' });
    });
  });

  describe('debouncedUpdateQuery', () => {
    it('should create debounced callback with correct parameters', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      renderHook(() => useIntermediateQuery());

      // Verify useDebouncedCallback was called with correct delay and options
      expect(mockUseDebouncedCallback).toHaveBeenCalledWith(expect.any(Function), 700, {
        leading: true,
        trailing: false,
      });
    });

    it('should call updateQuery when debounced callback is invoked', () => {
      mockUseDebouncedCallback.mockImplementation((fn) => {
        return fn as any;
      });

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.debouncedUpdateQuery('debounced query');
      });

      expect(mockUpdateQuery).toHaveBeenCalledWith({ q: 'debounced query' });
    });
  });

  describe('clearing query', () => {
    it('should set clear flag to true when clearQuery is called', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: 'test' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.clearQuery();
      });

      expect(mockSetClearQueryFlag).toHaveBeenCalledWith(true);
    });

    it('should set clear flag to false when onDoneClearingQuery is called', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: true,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.onDoneClearingQuery();
      });

      expect(mockSetClearQueryFlag).toHaveBeenCalledWith(false);
    });

    it('should handle multiple clear operations', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: 'test' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.clearQuery();
        result.current.clearQuery();
      });

      expect(mockSetClearQueryFlag).toHaveBeenCalledTimes(2);
      expect(mockSetClearQueryFlag).toHaveBeenCalledWith(true);
    });
  });

  describe('appending to query', () => {
    it('should create debounced callback for appendToQuery with correct parameters', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      renderHook(() => useIntermediateQuery());

      // Find the call for appendToQuery (300ms delay)
      const appendCall = mockUseDebouncedCallback.mock.calls.find((call) => call[1] === 300);

      expect(appendCall).toBeDefined();
      expect(appendCall[2]).toEqual({ leading: true });
    });

    it('should call setQueryAddition when appendToQuery is invoked', () => {
      mockUseDebouncedCallback.mockImplementation((fn) => fn as any);

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: 'original' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.appendToQuery('additional text');
      });

      expect(mockSetQueryAddition).toHaveBeenCalledWith('additional text');
    });

    it('should set queryAddition to null when onDoneAppendingToQuery is called', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: 'some addition',
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.onDoneAppendingToQuery();
      });

      expect(mockSetQueryAddition).toHaveBeenCalledWith(null);
    });

    it('should handle multiple append operations', () => {
      mockUseDebouncedCallback.mockImplementation((fn) => fn as any);

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: 'test' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      act(() => {
        result.current.appendToQuery('text1');
        result.current.appendToQuery('text2');
      });

      expect(mockSetQueryAddition).toHaveBeenCalledTimes(2);
      expect(mockSetQueryAddition).toHaveBeenNthCalledWith(1, 'text1');
      expect(mockSetQueryAddition).toHaveBeenNthCalledWith(2, 'text2');
    });
  });

  describe('reactivity', () => {
    it('should update when query changes in store', () => {
      let currentQuery = 'initial';

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: currentQuery },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result, rerender } = renderHook(() => useIntermediateQuery());

      expect(result.current.query).toBe('initial');

      currentQuery = 'updated';
      rerender();

      expect(result.current.query).toBe('updated');
    });

    it('should update when queryAddition changes in store', () => {
      let currentAddition: string | null = null;

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: currentAddition,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result, rerender } = renderHook(() => useIntermediateQuery());

      expect(result.current.queryAddition).toBe(null);

      currentAddition = 'new addition';
      rerender();

      expect(result.current.queryAddition).toBe('new addition');
    });

    it('should update when clearQueryFlag changes in store', () => {
      let currentFlag = false;

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: currentFlag,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result, rerender } = renderHook(() => useIntermediateQuery());

      expect(result.current.isClearingQuery).toBe(false);

      currentFlag = true;
      rerender();

      expect(result.current.isClearingQuery).toBe(true);
    });
  });

  describe('integration', () => {
    it('should work correctly with all returned values', () => {
      mockUseDebouncedCallback.mockImplementation((fn) => fn as any);

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: 'test query' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: 'addition',
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      // Verify all returned values
      expect(result.current.query).toBe('test query');
      expect(result.current.queryAddition).toBe('addition');
      expect(result.current.isClearingQuery).toBe(false);
      expect(typeof result.current.updateQuery).toBe('function');
      expect(typeof result.current.debouncedUpdateQuery).toBe('function');
      expect(typeof result.current.clearQuery).toBe('function');
      expect(typeof result.current.onDoneClearingQuery).toBe('function');
      expect(typeof result.current.appendToQuery).toBe('function');
      expect(typeof result.current.onDoneAppendingToQuery).toBe('function');

      // Test all functions work
      act(() => {
        result.current.updateQuery('new');
        result.current.clearQuery();
        result.current.appendToQuery('append');
      });

      expect(mockUpdateQuery).toHaveBeenCalledWith({ q: 'new' });
      expect(mockSetClearQueryFlag).toHaveBeenCalledWith(true);
      expect(mockSetQueryAddition).toHaveBeenCalledWith('append');
    });
  });

  describe('edge cases', () => {
    it('should handle null queryAddition', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.queryAddition).toBe(null);
    });

    it('should handle empty string query', () => {
      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: '' },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.query).toBe('');
    });

    it('should handle very long query string', () => {
      const longQuery = 'a'.repeat(10000);

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: longQuery },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.query).toBe(longQuery);
    });

    it('should handle special characters in query', () => {
      const specialQuery = 'test !@#$%^&*() "quotes" [brackets]';

      mockUseStore.mockImplementation((selector: any) => {
        const state = {
          query: { q: specialQuery },
          updateQuery: mockUpdateQuery,
          setQueryAddition: mockSetQueryAddition,
          queryAddition: null,
          clearQueryFlag: false,
          setClearQueryFlag: mockSetClearQueryFlag,
        };
        return selector(state);
      });

      const { result } = renderHook(() => useIntermediateQuery());

      expect(result.current.query).toBe(specialQuery);
    });
  });
});

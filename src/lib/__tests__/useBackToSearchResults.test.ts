import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useBackToSearchResults } from '../useBackToSearchResults';
import * as store from '@/store';
import * as paginationUtils from '@/components/ResultList/Pagination/usePagination';
import * as searchUtils from '@/utils/common/search';

vi.mock('@/store', () => ({
  useStore: vi.fn(),
}));

vi.mock('@/components/ResultList/Pagination/usePagination', () => ({
  calculatePage: vi.fn(),
}));

vi.mock('@/utils/common/search', () => ({
  makeSearchParams: vi.fn(),
}));

describe('useBackToSearchResults', () => {
  const mockUseStore = vi.mocked(store.useStore);
  const mockCalculatePage = vi.mocked(paginationUtils.calculatePage);
  const mockMakeSearchParams = vi.mocked(searchUtils.makeSearchParams);

  beforeEach(() => {
    vi.clearAllMocks();
    mockCalculatePage.mockReturnValue(1);
    mockMakeSearchParams.mockReturnValue('q=test');
  });

  describe('show flag', () => {
    it('should show when query is not empty', () => {
      mockUseStore.mockReturnValue({
        q: 'supernova',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(true);
    });

    it('should not show when query is empty string', () => {
      mockUseStore.mockReturnValue({
        q: '',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(false);
    });

    it('should not show when query is "*:*"', () => {
      mockUseStore.mockReturnValue({
        q: '*:*',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(false);
    });

    it('should show when query is complex', () => {
      mockUseStore.mockReturnValue({
        q: 'author:"Smith, J." AND year:2020',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(true);
    });

    it('should show when query contains special characters', () => {
      mockUseStore.mockReturnValue({
        q: 'galaxy AND (z>1)',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(true);
    });

    it('should show when query is a single word', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(true);
    });
  });

  describe('getSearchHref', () => {
    it('should return correct href structure', () => {
      mockUseStore.mockReturnValue({
        q: 'supernova',
        start: 0,
        rows: 25,
      });
      mockCalculatePage.mockReturnValue(1);
      mockMakeSearchParams.mockReturnValue('q=supernova&p=1');

      const { result } = renderHook(() => useBackToSearchResults());
      const href = result.current.getSearchHref();

      expect(href).toEqual({
        pathname: '/search',
        search: 'q=supernova&p=1',
      });
    });

    it('should call calculatePage with correct arguments', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 50,
        rows: 25,
      });
      mockCalculatePage.mockReturnValue(3);

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockCalculatePage).toHaveBeenCalledWith(50, 25);
    });

    it('should call makeSearchParams with latestQuery and calculated page', () => {
      const mockQuery = {
        q: 'galaxy',
        start: 100,
        rows: 50,
        filter: 'property:refereed',
      };

      mockUseStore.mockReturnValue(mockQuery);
      mockCalculatePage.mockReturnValue(3);

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockMakeSearchParams).toHaveBeenCalledWith({
        ...mockQuery,
        p: 3,
      });
    });

    it('should handle different page numbers', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 200,
        rows: 25,
      });
      mockCalculatePage.mockReturnValue(9);
      mockMakeSearchParams.mockReturnValue('q=test&p=9');

      const { result } = renderHook(() => useBackToSearchResults());
      const href = result.current.getSearchHref();

      expect(href.search).toBe('q=test&p=9');
    });

    it('should handle different rows values', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 100,
        rows: 50,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockCalculatePage).toHaveBeenCalledWith(100, 50);
    });

    it('should preserve other query parameters', () => {
      const mockQuery = {
        q: 'supernova',
        start: 0,
        rows: 25,
        filter: 'year:2020',
        sort: 'date desc',
      };

      mockUseStore.mockReturnValue(mockQuery);
      mockCalculatePage.mockReturnValue(1);

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockMakeSearchParams).toHaveBeenCalledWith({
        ...mockQuery,
        p: 1,
      });
    });
  });

  describe('callback stability', () => {
    it('should return new getSearchHref when latestQuery changes', () => {
      mockUseStore.mockReturnValue({
        q: 'query1',
        start: 0,
        rows: 25,
      });

      const { result, rerender } = renderHook(() => useBackToSearchResults());
      const firstCallback = result.current.getSearchHref;

      // Change query
      mockUseStore.mockReturnValue({
        q: 'query2',
        start: 0,
        rows: 25,
      });
      rerender();

      const secondCallback = result.current.getSearchHref;

      // Callback should be different due to dependency change
      expect(firstCallback).not.toBe(secondCallback);
    });

    it('should return same getSearchHref when latestQuery stays the same', () => {
      const mockQuery = {
        q: 'query',
        start: 0,
        rows: 25,
      };

      mockUseStore.mockReturnValue(mockQuery);

      const { result, rerender } = renderHook(() => useBackToSearchResults());
      const firstCallback = result.current.getSearchHref;

      // Same query
      mockUseStore.mockReturnValue(mockQuery);
      rerender();

      const secondCallback = result.current.getSearchHref;

      // Callback should be the same
      expect(firstCallback).toBe(secondCallback);
    });
  });

  describe('edge cases', () => {
    it('should handle start of 0', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockCalculatePage).toHaveBeenCalledWith(0, 25);
    });

    it('should handle very large start values', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 10000,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockCalculatePage).toHaveBeenCalledWith(10000, 25);
    });

    it('should handle small rows values', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 10,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockCalculatePage).toHaveBeenCalledWith(0, 10);
    });

    it('should handle large rows values', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 500,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();

      expect(mockCalculatePage).toHaveBeenCalledWith(0, 500);
    });

    it('should handle query with whitespace', () => {
      mockUseStore.mockReturnValue({
        q: '  supernova  ',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(true);
    });

    it('should handle empty makeSearchParams result', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });
      mockMakeSearchParams.mockReturnValue('');

      const { result } = renderHook(() => useBackToSearchResults());
      const href = result.current.getSearchHref();

      expect(href).toEqual({
        pathname: '/search',
        search: '',
      });
    });

    it('should handle complex search params', () => {
      mockUseStore.mockReturnValue({
        q: 'author:"Smith" AND year:2020',
        start: 0,
        rows: 25,
      });
      mockMakeSearchParams.mockReturnValue('q=author%3A%22Smith%22%20AND%20year%3A2020&p=1');

      const { result } = renderHook(() => useBackToSearchResults());
      const href = result.current.getSearchHref();

      expect(href.search).toBe('q=author%3A%22Smith%22%20AND%20year%3A2020&p=1');
    });
  });

  describe('return value structure', () => {
    it('should return object with getSearchHref and show properties', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });

      const { result } = renderHook(() => useBackToSearchResults());

      expect(result.current).toHaveProperty('getSearchHref');
      expect(result.current).toHaveProperty('show');
      expect(typeof result.current.getSearchHref).toBe('function');
      expect(typeof result.current.show).toBe('boolean');
    });

    it('should maintain consistent return structure across re-renders', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });

      const { result, rerender } = renderHook(() => useBackToSearchResults());

      const keys1 = Object.keys(result.current);
      rerender();
      const keys2 = Object.keys(result.current);

      expect(keys1).toEqual(keys2);
      expect(keys1).toEqual(['getSearchHref', 'show']);
    });
  });

  describe('integration scenarios', () => {
    it('should handle transition from no query to valid query', () => {
      mockUseStore.mockReturnValue({
        q: '',
        start: 0,
        rows: 25,
      });

      const { result, rerender } = renderHook(() => useBackToSearchResults());
      expect(result.current.show).toBe(false);

      mockUseStore.mockReturnValue({
        q: 'supernova',
        start: 0,
        rows: 25,
      });
      rerender();

      expect(result.current.show).toBe(true);
    });

    it('should handle pagination changes', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });

      const { result, rerender } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();
      expect(mockCalculatePage).toHaveBeenCalledWith(0, 25);

      mockUseStore.mockReturnValue({
        q: 'test',
        start: 50,
        rows: 25,
      });
      rerender();

      result.current.getSearchHref();
      expect(mockCalculatePage).toHaveBeenCalledWith(50, 25);
    });

    it('should handle rows per page changes', () => {
      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 25,
      });

      const { result, rerender } = renderHook(() => useBackToSearchResults());
      result.current.getSearchHref();
      expect(mockCalculatePage).toHaveBeenCalledWith(0, 25);

      mockUseStore.mockReturnValue({
        q: 'test',
        start: 0,
        rows: 50,
      });
      rerender();

      result.current.getSearchHref();
      expect(mockCalculatePage).toHaveBeenCalledWith(0, 50);
    });
  });
});

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGetAbstractDoc } from '../useGetAbstractDoc';
import * as searchApi from '@/api/search/search';
import { IDocsEntity } from '@/api/search/types';

vi.mock('@/api/search/search', () => ({
  useGetAbstract: vi.fn(),
}));

describe('useGetAbstractDoc', () => {
  const mockUseGetAbstract = vi.mocked(searchApi.useGetAbstract);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('basic functionality', () => {
    it('should return first doc from abstract data', () => {
      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Test Paper'],
        author: ['Author, A.'],
      } as any;

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('2023TEST..123..456A'));

      expect(result.current).toBe(mockDoc);
    });

    it('should call useGetAbstract with correct id', () => {
      mockUseGetAbstract.mockReturnValue({
        data: { docs: [] },
      } as any);

      renderHook(() => useGetAbstractDoc('test-bibcode'));

      expect(mockUseGetAbstract).toHaveBeenCalledWith({ id: 'test-bibcode' });
    });

    it('should return first doc when multiple docs exist', () => {
      const mockDoc1: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['First Paper'],
      } as any;
      const mockDoc2: IDocsEntity = {
        bibcode: '2023TEST..123..789B',
        title: ['Second Paper'],
      } as any;

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc1, mockDoc2] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBe(mockDoc1);
    });
  });

  describe('undefined/null handling', () => {
    it('should return undefined when data is null', () => {
      mockUseGetAbstract.mockReturnValue({
        data: null,
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBeUndefined();
    });

    it('should return undefined when data is undefined', () => {
      mockUseGetAbstract.mockReturnValue({
        data: undefined,
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBeUndefined();
    });

    it('should return undefined when docs array is empty', () => {
      mockUseGetAbstract.mockReturnValue({
        data: { docs: [] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBeUndefined();
    });

    it('should return undefined when docs is undefined', () => {
      mockUseGetAbstract.mockReturnValue({
        data: {},
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBeUndefined();
    });

    it('should return undefined when docs is null', () => {
      mockUseGetAbstract.mockReturnValue({
        data: { docs: null },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBeUndefined();
    });
  });

  describe('various doc structures', () => {
    it('should handle doc with minimal fields', () => {
      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
      } as any;

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toEqual(mockDoc);
    });

    it('should handle doc with all fields', () => {
      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Comprehensive Test Paper'],
        author: ['Author, A.', 'Coauthor, B.'],
        abstract: 'This is a test abstract',
        pubdate: '2023-01-00',
        pub: 'Test Journal',
        doi: ['10.1234/test'],
        identifier: ['2023TEST..123..456A', 'arXiv:2301.12345'],
        keyword: ['testing', 'science'],
        aff: ['Institution A', 'Institution B'],
        volume: '123',
        page: ['456'],
        citation_count: 42,
        read_count: 100,
      } as any;

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toEqual(mockDoc);
    });

    it('should handle doc with nested objects', () => {
      const mockDoc: any = {
        bibcode: '2023TEST..123..456A',
        title: ['Test'],
        property: {
          nested: {
            deep: 'value',
          },
        },
      };

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toEqual(mockDoc);
    });

    it('should handle doc with arrays', () => {
      const mockDoc: any = {
        bibcode: '2023TEST..123..456A',
        author: ['Author1', 'Author2', 'Author3'],
        keyword: ['key1', 'key2'],
        identifier: ['id1', 'id2', 'id3'],
      };

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toEqual(mockDoc);
    });
  });

  describe('reactivity', () => {
    it('should update when id changes', () => {
      const mockDoc1: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Paper 1'],
      } as any;
      const mockDoc2: IDocsEntity = {
        bibcode: '2023TEST..789..012B',
        title: ['Paper 2'],
      } as any;

      mockUseGetAbstract.mockReturnValueOnce({
        data: { docs: [mockDoc1] },
      } as any);

      const { result, rerender } = renderHook(({ id }) => useGetAbstractDoc(id), {
        initialProps: { id: 'id1' },
      });

      expect(result.current).toBe(mockDoc1);

      mockUseGetAbstract.mockReturnValueOnce({
        data: { docs: [mockDoc2] },
      } as any);

      rerender({ id: 'id2' });

      expect(result.current).toBe(mockDoc2);
      expect(mockUseGetAbstract).toHaveBeenCalledTimes(2);
      expect(mockUseGetAbstract).toHaveBeenNthCalledWith(1, { id: 'id1' });
      expect(mockUseGetAbstract).toHaveBeenNthCalledWith(2, { id: 'id2' });
    });

    it('should handle transition from data to no data', () => {
      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Paper'],
      } as any;

      mockUseGetAbstract.mockReturnValueOnce({
        data: { docs: [mockDoc] },
      } as any);

      const { result, rerender } = renderHook(({ id }) => useGetAbstractDoc(id), {
        initialProps: { id: 'id1' },
      });

      expect(result.current).toBe(mockDoc);

      mockUseGetAbstract.mockReturnValueOnce({
        data: { docs: [] },
      } as any);

      rerender({ id: 'id2' });

      expect(result.current).toBeUndefined();
    });

    it('should handle transition from no data to data', () => {
      mockUseGetAbstract.mockReturnValueOnce({
        data: { docs: [] },
      } as any);

      const { result, rerender } = renderHook(({ id }) => useGetAbstractDoc(id), {
        initialProps: { id: 'id1' },
      });

      expect(result.current).toBeUndefined();

      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Paper'],
      } as any;

      mockUseGetAbstract.mockReturnValueOnce({
        data: { docs: [mockDoc] },
      } as any);

      rerender({ id: 'id2' });

      expect(result.current).toBe(mockDoc);
    });
  });

  describe('edge cases', () => {
    it('should handle empty string id', () => {
      mockUseGetAbstract.mockReturnValue({
        data: { docs: [] },
      } as any);

      renderHook(() => useGetAbstractDoc(''));

      expect(mockUseGetAbstract).toHaveBeenCalledWith({ id: '' });
    });

    it('should handle special characters in id', () => {
      mockUseGetAbstract.mockReturnValue({
        data: { docs: [] },
      } as any);

      renderHook(() => useGetAbstractDoc('2023TEST..123..456A:special-chars_!@#'));

      expect(mockUseGetAbstract).toHaveBeenCalledWith({ id: '2023TEST..123..456A:special-chars_!@#' });
    });

    it('should handle very long id', () => {
      const longId = 'a'.repeat(1000);

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [] },
      } as any);

      renderHook(() => useGetAbstractDoc(longId));

      expect(mockUseGetAbstract).toHaveBeenCalledWith({ id: longId });
    });

    it('should return same reference for same doc', () => {
      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Paper'],
      } as any;

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result, rerender } = renderHook(() => useGetAbstractDoc('test-id'));

      const firstResult = result.current;
      rerender();
      const secondResult = result.current;

      expect(firstResult).toBe(secondResult);
    });

    it('should handle doc with null/undefined properties', () => {
      const mockDoc: any = {
        bibcode: '2023TEST..123..456A',
        title: null,
        author: undefined,
        abstract: '',
      };

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toEqual(mockDoc);
    });
  });

  describe('caching behavior', () => {
    it('should fetch from pre-filled cache (as per comment)', () => {
      // The comment in the source says "this *should* only ever fetch from pre-filled cache"
      // We verify that it just calls useGetAbstract and returns the result
      const mockDoc: IDocsEntity = {
        bibcode: '2023TEST..123..456A',
        title: ['Cached Paper'],
      } as any;

      mockUseGetAbstract.mockReturnValue({
        data: { docs: [mockDoc] },
      } as any);

      const { result } = renderHook(() => useGetAbstractDoc('test-id'));

      expect(result.current).toBe(mockDoc);
      expect(mockUseGetAbstract).toHaveBeenCalledTimes(1);
    });
  });
});

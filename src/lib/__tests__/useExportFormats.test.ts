/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useExportFormats } from '../useExportFormats';
import * as exportApi from '@/api/export/export';
import { ExportFormatsApiResponse } from '@/api/export/types';

vi.mock('@/api/export/export', () => ({
  useGetExportFormats: vi.fn(),
}));

describe('useExportFormats', () => {
  const mockUseGetExportFormats = vi.mocked(exportApi.useGetExportFormats);

  const mockFormats: ExportFormatsApiResponse = [
    { name: 'BibTeX', type: 'tagged', route: '/bibtex', extension: 'bib' },
    { name: 'ADS', type: 'tagged', route: '/ads', extension: 'txt' },
    { name: 'AASTeX', type: 'LaTeX', route: '/aastex', extension: 'txt' },
    { name: 'APS Journals', type: 'HTML', route: '/apsj', extension: 'rtf' },
    { name: 'custom', type: 'custom', route: '/custom', extension: 'txt' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseGetExportFormats.mockReturnValue({
      data: mockFormats,
    } as any);
  });

  describe('format data', () => {
    it('should return raw format data', () => {
      const { result } = renderHook(() => useExportFormats());
      expect(result.current.format).toEqual(mockFormats);
    });

    it('should handle empty format list', () => {
      mockUseGetExportFormats.mockReturnValue({
        data: [],
      } as any);

      const { result } = renderHook(() => useExportFormats());
      expect(result.current.format).toEqual([]);
      expect(result.current.formatOptions).toEqual([]);
    });
  });

  describe('formatOptions', () => {
    it('should transform formats into options', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.formatOptions).toHaveLength(5);
      expect(result.current.formatOptions[0]).toEqual({
        id: 'bibtex',
        label: 'BibTeX',
        value: 'bibtex',
        type: 'tagged',
        route: '/bibtex',
        ext: 'bib',
      });
    });

    it('should strip leading slash from route for id and value', () => {
      const { result } = renderHook(() => useExportFormats());

      result.current.formatOptions.forEach((option) => {
        expect(option.id).not.toMatch(/^\//);
        expect(option.value).not.toMatch(/^\//);
        expect(option.route).toMatch(/^\//);
      });
    });

    it('should preserve all format types', () => {
      const { result } = renderHook(() => useExportFormats());

      const types = result.current.formatOptions.map((o) => o.type);
      expect(types).toContain('tagged');
      expect(types).toContain('LaTeX');
      expect(types).toContain('HTML');
      expect(types).toContain('custom');
    });

    it('should include extension in options', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.formatOptions[0].ext).toBe('bib');
      expect(result.current.formatOptions[1].ext).toBe('txt');
    });
  });

  describe('formatOptionsNoCustom', () => {
    it('should exclude custom format', () => {
      const { result } = renderHook(() => useExportFormats());

      const customOption = result.current.formatOptionsNoCustom.find((o) => o.id === 'custom');
      expect(customOption).toBeUndefined();
    });

    it('should include all other formats', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.formatOptionsNoCustom).toHaveLength(4);
      expect(result.current.formatOptionsNoCustom.map((o) => o.id)).toEqual(['bibtex', 'ads', 'aastex', 'apsj']);
    });

    it('should return empty array when only custom format exists', () => {
      mockUseGetExportFormats.mockReturnValue({
        data: [{ name: 'custom', type: 'custom', route: '/custom', extension: 'txt' }],
      } as any);

      const { result } = renderHook(() => useExportFormats());
      expect(result.current.formatOptionsNoCustom).toEqual([]);
    });
  });

  describe('getFormatById', () => {
    it('should find format by id', () => {
      const { result } = renderHook(() => useExportFormats());

      const format = result.current.getFormatById('bibtex');
      expect(format).toEqual(mockFormats[0]);
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useExportFormats());

      const format = result.current.getFormatById('nonexistent');
      expect(format).toBeUndefined();
    });

    it('should handle empty string id', () => {
      const { result } = renderHook(() => useExportFormats());

      const format = result.current.getFormatById('');
      expect(format).toBeUndefined();
    });

    it('should find multiple different formats', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.getFormatById('bibtex')).toEqual(mockFormats[0]);
      expect(result.current.getFormatById('ads')).toEqual(mockFormats[1]);
      expect(result.current.getFormatById('aastex')).toEqual(mockFormats[2]);
    });
  });

  describe('getFormatOptionById', () => {
    it('should find format option by id', () => {
      const { result } = renderHook(() => useExportFormats());

      const option = result.current.getFormatOptionById('bibtex');
      expect(option?.id).toBe('bibtex');
      expect(option?.label).toBe('BibTeX');
    });

    it('should return undefined for non-existent id', () => {
      const { result } = renderHook(() => useExportFormats());

      const option = result.current.getFormatOptionById('invalid');
      expect(option).toBeUndefined();
    });

    it('should find custom format option', () => {
      const { result } = renderHook(() => useExportFormats());

      const option = result.current.getFormatOptionById('custom');
      expect(option?.id).toBe('custom');
    });
  });

  describe('getFormatOptionByLabel', () => {
    it('should find format option by label', () => {
      const { result } = renderHook(() => useExportFormats());

      const option = result.current.getFormatOptionByLabel('BibTeX');
      expect(option?.id).toBe('bibtex');
      expect(option?.label).toBe('BibTeX');
    });

    it('should return undefined for non-existent label', () => {
      const { result } = renderHook(() => useExportFormats());

      const option = result.current.getFormatOptionByLabel('Invalid Format');
      expect(option).toBeUndefined();
    });

    it('should handle case-sensitive matching', () => {
      const { result } = renderHook(() => useExportFormats());

      const option = result.current.getFormatOptionByLabel('bibtex'); // lowercase
      expect(option).toBeUndefined(); // Should not match 'BibTeX'
    });

    it('should find all labels correctly', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.getFormatOptionByLabel('BibTeX')).toBeDefined();
      expect(result.current.getFormatOptionByLabel('ADS')).toBeDefined();
      expect(result.current.getFormatOptionByLabel('AASTeX')).toBeDefined();
      expect(result.current.getFormatOptionByLabel('APS Journals')).toBeDefined();
    });
  });

  describe('isValidFormat', () => {
    it('should return true for valid format id', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormat('bibtex')).toBe(true);
      expect(result.current.isValidFormat('ads')).toBe(true);
    });

    it('should return false for invalid format id', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormat('invalid')).toBe(false);
    });

    it('should return false for empty string', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormat('')).toBe(false);
    });

    it('should return true for custom format', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormat('custom')).toBe(true);
    });
  });

  describe('isValidFormatLabel', () => {
    it('should return true for valid format label', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormatLabel('BibTeX')).toBe(true);
      expect(result.current.isValidFormatLabel('ADS')).toBe(true);
    });

    it('should return false for invalid format label', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormatLabel('Invalid')).toBe(false);
    });

    it('should return false for non-string values', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormatLabel(null as any)).toBe(false);
      expect(result.current.isValidFormatLabel(undefined as any)).toBe(false);
      expect(result.current.isValidFormatLabel(123 as any)).toBe(false);
    });

    it('should handle case sensitivity', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidFormatLabel('BibTeX')).toBe(true);
      expect(result.current.isValidFormatLabel('bibtex')).toBe(false);
    });
  });

  describe('isValidCitationFormatId', () => {
    it('should return true for HTML type formats', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidCitationFormatId('apsj')).toBe(true);
    });

    it('should return false for non-HTML type formats', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidCitationFormatId('bibtex')).toBe(false); // tagged
      expect(result.current.isValidCitationFormatId('aastex')).toBe(false); // LaTeX
      expect(result.current.isValidCitationFormatId('custom')).toBe(false); // custom
    });

    it('should return false for invalid id', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidCitationFormatId('invalid')).toBe(false);
    });

    it('should return false for non-string values', () => {
      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidCitationFormatId(null as any)).toBe(false);
      expect(result.current.isValidCitationFormatId(undefined as any)).toBe(false);
      expect(result.current.isValidCitationFormatId(123 as any)).toBe(false);
    });
  });

  describe('callback stability', () => {
    it('should memoize callbacks when data does not change', () => {
      const { result, rerender } = renderHook(() => useExportFormats());

      const firstGetFormatById = result.current.getFormatById;
      const firstIsValidFormat = result.current.isValidFormat;

      rerender();

      expect(result.current.getFormatById).toBe(firstGetFormatById);
      expect(result.current.isValidFormat).toBe(firstIsValidFormat);
    });

    it('should update callbacks when data changes', () => {
      const { result, rerender } = renderHook(() => useExportFormats());

      const firstGetFormatById = result.current.getFormatById;

      // Change data
      mockUseGetExportFormats.mockReturnValue({
        data: [{ name: 'New Format', type: 'tagged', route: '/new', extension: 'txt' }],
      } as any);

      rerender();

      expect(result.current.getFormatById).not.toBe(firstGetFormatById);
    });

    it('should memoize formatOptions when data does not change', () => {
      const { result, rerender } = renderHook(() => useExportFormats());

      const firstFormatOptions = result.current.formatOptions;

      rerender();

      expect(result.current.formatOptions).toBe(firstFormatOptions);
    });
  });

  describe('useGetExportFormats options', () => {
    it('should pass retry: false to useGetExportFormats', () => {
      renderHook(() => useExportFormats());

      expect(mockUseGetExportFormats).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: false,
        }),
      );
    });

    it('should pass custom options to useGetExportFormats', () => {
      const customOptions = { enabled: false };
      renderHook(() => useExportFormats(customOptions));

      expect(mockUseGetExportFormats).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: false,
          enabled: false,
        }),
      );
    });

    it('should merge custom options with defaults', () => {
      const customOptions = { staleTime: 5000, enabled: true };
      renderHook(() => useExportFormats(customOptions));

      expect(mockUseGetExportFormats).toHaveBeenCalledWith(
        expect.objectContaining({
          retry: false,
          staleTime: 5000,
          enabled: true,
        }),
      );
    });
  });

  describe('edge cases', () => {
    it('should handle formats with special characters in route', () => {
      mockUseGetExportFormats.mockReturnValue({
        data: [{ name: 'Test', type: 'tagged', route: '/test-format', extension: 'txt' }],
      } as any);

      const { result } = renderHook(() => useExportFormats());

      expect(result.current.formatOptions[0].id).toBe('test-format');
      expect(result.current.formatOptions[0].route).toBe('/test-format');
    });

    it('should handle formats with different extension types', () => {
      mockUseGetExportFormats.mockReturnValue({
        data: [
          { name: 'XML Format', type: 'XML', route: '/xml', extension: 'xml' },
          { name: 'JSON Format', type: 'custom', route: '/json', extension: 'json' },
        ],
      } as any);

      const { result } = renderHook(() => useExportFormats());

      expect(result.current.formatOptions[0].ext).toBe('xml');
      expect(result.current.formatOptions[1].ext).toBe('json');
    });

    it('should handle multiple HTML formats', () => {
      mockUseGetExportFormats.mockReturnValue({
        data: [
          { name: 'HTML1', type: 'HTML', route: '/html1', extension: 'html' },
          { name: 'HTML2', type: 'HTML', route: '/html2', extension: 'html' },
        ],
      } as any);

      const { result } = renderHook(() => useExportFormats());

      expect(result.current.isValidCitationFormatId('html1')).toBe(true);
      expect(result.current.isValidCitationFormatId('html2')).toBe(true);
    });
  });
});

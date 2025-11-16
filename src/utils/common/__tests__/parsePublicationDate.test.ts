import { describe, expect, it } from 'vitest';
import { parsePublicationDate } from '../parsePublicationDate';

describe('parsePublicationDate', () => {
  describe('full dates (YYYY-MM-DD)', () => {
    it('should parse valid full dates', () => {
      expect(parsePublicationDate('2024-03-15')).toEqual({
        year: '2024',
        month: '03',
        day: '15',
      });

      expect(parsePublicationDate('2020-01-01')).toEqual({
        year: '2020',
        month: '01',
        day: '01',
      });

      expect(parsePublicationDate('2023-12-31')).toEqual({
        year: '2023',
        month: '12',
        day: '31',
      });
    });

    it('should parse dates with zero padding', () => {
      expect(parsePublicationDate('2024-09-05')).toEqual({
        year: '2024',
        month: '09',
        day: '05',
      });
    });

    it('should parse edge case dates', () => {
      expect(parsePublicationDate('1900-01-01')).toEqual({
        year: '1900',
        month: '01',
        day: '01',
      });

      expect(parsePublicationDate('2099-12-31')).toEqual({
        year: '2099',
        month: '12',
        day: '31',
      });
    });
  });

  describe('partial dates (YYYY-MM)', () => {
    it('should parse year-month dates', () => {
      expect(parsePublicationDate('2024-03')).toEqual({
        year: '2024',
        month: '03',
        day: '00',
      });

      expect(parsePublicationDate('2020-01')).toEqual({
        year: '2020',
        month: '01',
        day: '00',
      });

      expect(parsePublicationDate('2023-12')).toEqual({
        year: '2023',
        month: '12',
        day: '00',
      });
    });

    it('should parse year-month dates with zero padding', () => {
      expect(parsePublicationDate('2024-09')).toEqual({
        year: '2024',
        month: '09',
        day: '00',
      });
    });
  });

  describe('year-only dates', () => {
    it('should parse year-only dates', () => {
      expect(parsePublicationDate('2024')).toEqual({
        year: '2024',
        month: '00',
        day: '00',
      });

      expect(parsePublicationDate('2020')).toEqual({
        year: '2020',
        month: '00',
        day: '00',
      });

      expect(parsePublicationDate('1999')).toEqual({
        year: '1999',
        month: '00',
        day: '00',
      });
    });
  });

  describe('invalid inputs', () => {
    it('should return null for empty string', () => {
      expect(parsePublicationDate('')).toBe(null);
    });

    it('should handle whitespace strings (extracts year portion)', () => {
      // The function uses isNilOrEmpty which checks for nil, but whitespace strings
      // get processed - they extract the first 4 characters as year
      const result = parsePublicationDate('   ');
      expect(result?.year).toBe('   ');
      expect(result?.month).toBe('00');
      expect(result?.day).toBe('00');
    });

    it('should handle malformed dates gracefully', () => {
      // Invalid format - falls back to year extraction
      const result = parsePublicationDate('2024/03/15');
      expect(result?.year).toBe('2024');
      expect(result?.month).toBe('00');
      expect(result?.day).toBe('00');
    });

    it('should handle dates with invalid separators', () => {
      const result = parsePublicationDate('2024.03.15');
      expect(result?.year).toBe('2024');
      expect(result?.month).toBe('00');
      expect(result?.day).toBe('00');
    });

    it('should handle incomplete dates', () => {
      const result = parsePublicationDate('2024-');
      expect(result?.year).toBe('2024');
      expect(result?.month).toBe('00');
      expect(result?.day).toBe('00');
    });
  });

  describe('edge cases', () => {
    it('should handle dates with 00 values', () => {
      expect(parsePublicationDate('2024-00-00')).toEqual({
        year: '2024',
        month: '00',
        day: '00',
      });

      expect(parsePublicationDate('2024-03-00')).toEqual({
        year: '2024',
        month: '03',
        day: '00',
      });

      expect(parsePublicationDate('2024-00-15')).toEqual({
        year: '2024',
        month: '00',
        day: '15',
      });
    });

    it('should extract year from any 4-digit prefix', () => {
      const result = parsePublicationDate('2024abcd');
      expect(result?.year).toBe('2024');
    });

    it('should handle dates with extra characters', () => {
      // Will not match full date regex, falls back to year extraction
      const result = parsePublicationDate('2024-03-15T00:00:00Z');
      expect(result?.year).toBe('2024');
      expect(result?.month).toBe('00');
      expect(result?.day).toBe('00');
    });

    it('should handle very old years', () => {
      expect(parsePublicationDate('1000-01-01')).toEqual({
        year: '1000',
        month: '01',
        day: '01',
      });
    });

    it('should handle future years', () => {
      expect(parsePublicationDate('9999-12-31')).toEqual({
        year: '9999',
        month: '12',
        day: '31',
      });
    });

    it('should handle dates with invalid months (not validated)', () => {
      // Function doesn't validate month/day values, just parses format
      expect(parsePublicationDate('2024-13-01')).toEqual({
        year: '2024',
        month: '13',
        day: '01',
      });

      expect(parsePublicationDate('2024-99-99')).toEqual({
        year: '2024',
        month: '99',
        day: '99',
      });
    });
  });
});

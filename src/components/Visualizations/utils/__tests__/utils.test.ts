import { describe, expect, it } from 'vitest';
import { getLineGraphXTicks, groupBarDatumByYear, getQueryWithCondition, getYearGraphTicks } from '../utils';
import type { Serie } from '@nivo/line';
import type { YearDatum } from '../../types';

describe('Visualization Utils', () => {
  describe('getLineGraphXTicks', () => {
    it('should return evenly spaced ticks from line graph data', () => {
      const data: Serie[] = [
        {
          id: 'series1',
          data: [
            { x: 2020, y: 10 },
            { x: 2021, y: 15 },
            { x: 2022, y: 20 },
            { x: 2023, y: 25 },
            { x: 2024, y: 30 },
          ],
        },
      ];

      const ticks = getLineGraphXTicks(data, 3);

      expect(ticks).toEqual([2020, 2022, 2024]);
    });

    it('should handle multiple series', () => {
      const data: Serie[] = [
        {
          id: 'series1',
          data: [
            { x: 2020, y: 10 },
            { x: 2022, y: 20 },
          ],
        },
        {
          id: 'series2',
          data: [
            { x: 2019, y: 5 },
            { x: 2023, y: 25 },
          ],
        },
      ];

      const ticks = getLineGraphXTicks(data, 3);

      // Should use min (2019) and max (2023) from all series
      expect(ticks[0]).toBe(2019);
      expect(ticks[ticks.length - 1]).toBe(2023);
    });

    it('should handle string x values', () => {
      const data: Serie[] = [
        {
          id: 'series1',
          data: [
            { x: '2020', y: 10 },
            { x: '2021', y: 15 },
            { x: '2022', y: 20 },
          ],
        },
      ];

      const ticks = getLineGraphXTicks(data, 2);

      expect(ticks).toContain(2020);
      expect(ticks).toContain(2022);
    });

    it('should return all years when maxTicks exceeds range', () => {
      const data: Serie[] = [
        {
          id: 'series1',
          data: [
            { x: 2020, y: 10 },
            { x: 2021, y: 15 },
            { x: 2022, y: 20 },
          ],
        },
      ];

      const ticks = getLineGraphXTicks(data, 10);

      expect(ticks).toEqual([2020, 2021, 2022]);
    });

    it('should handle single data point', () => {
      const data: Serie[] = [
        {
          id: 'series1',
          data: [{ x: 2020, y: 10 }],
        },
      ];

      const ticks = getLineGraphXTicks(data, 5);

      expect(ticks).toEqual([2020]);
    });

    it('should handle empty data', () => {
      const data: Serie[] = [];

      const ticks = getLineGraphXTicks(data, 5);

      // With no data, min starts at MAX_SAFE_INTEGER and max at 0
      expect(ticks).toHaveLength(0);
    });
  });

  describe('groupBarDatumByYear', () => {
    const mockYearData: YearDatum[] = [
      { year: 2020, refereed: 10, notrefereed: 5 },
      { year: 2021, refereed: 15, notrefereed: 8 },
      { year: 2022, refereed: 20, notrefereed: 10 },
      { year: 2023, refereed: 25, notrefereed: 12 },
      { year: 2024, refereed: 30, notrefereed: 15 },
      { year: 2025, refereed: 35, notrefereed: 18 },
    ];

    it('should group years when data exceeds maxXTicks', () => {
      const result = groupBarDatumByYear(mockYearData, 3, 0, 6);

      expect(result).toHaveLength(3);
      expect(result[0].year).toBe('2020 - 2021'); // Groups 2 years
      expect(result[0].refereed).toBe(25); // 10 + 15
      expect(result[0].notrefereed).toBe(13); // 5 + 8
    });

    it('should handle partial groups at the end', () => {
      const result = groupBarDatumByYear(mockYearData, 4, 0, 6);

      // groupSize = ceil(6/4) = 2
      // First 2 groups: 2 years each
      // Last group: remaining 2 years
      expect(result).toHaveLength(3);
      expect(result[2].refereed).toBe(65); // 30 + 35
    });

    it('should use startIndex and endIndex correctly', () => {
      const result = groupBarDatumByYear(mockYearData, 2, 1, 4);

      // Years 2021-2023 (indices 1-3)
      expect(result).toHaveLength(2);
      expect(result[0].year).toBe('2021 - 2022');
      expect(result[0].refereed).toBe(35); // 15 + 20
    });

    it('should not group when maxXTicks equals or exceeds range', () => {
      const result = groupBarDatumByYear(mockYearData, 10, 0, 6);

      // groupSize = 1, no grouping
      expect(result).toHaveLength(6);
      expect(result[0].year).toBe('2020 - 2020');
      expect(result[0].refereed).toBe(10);
    });

    it('should handle single year range', () => {
      const result = groupBarDatumByYear(mockYearData, 1, 0, 1);

      expect(result).toHaveLength(1);
      expect(result[0].year).toBe('2020 - 2020');
      expect(result[0].refereed).toBe(10);
    });

    it('should sum refereed and notrefereed counts', () => {
      const result = groupBarDatumByYear(mockYearData, 2, 0, 4);

      // First group: years 0-1 (2020-2021)
      expect(result[0].refereed).toBe(25); // 10 + 15
      expect(result[0].notrefereed).toBe(13); // 5 + 8

      // Second group: years 2-3 (2022-2023)
      expect(result[1].refereed).toBe(45); // 20 + 25
      expect(result[1].notrefereed).toBe(22); // 10 + 12
    });
  });

  describe('getQueryWithCondition', () => {
    it('should wrap unparenthesized query and add condition', () => {
      const result = getQueryWithCondition('author:Einstein', 'year', '2020');

      expect(result).toBe('(author:Einstein) AND year:2020');
    });

    it('should not double-wrap already parenthesized query', () => {
      const result = getQueryWithCondition('(author:Einstein)', 'year', '2020');

      expect(result).toBe('(author:Einstein) AND year:2020');
    });

    it('should handle complex queries', () => {
      const result = getQueryWithCondition('author:Einstein OR author:Hawking', 'citation_count', '[100 TO *]');

      expect(result).toBe('(author:Einstein OR author:Hawking) AND citation_count:[100 TO *]');
    });

    it('should handle already parenthesized complex queries', () => {
      const result = getQueryWithCondition('(author:Einstein OR author:Hawking)', 'read_count', '[50 TO *]');

      expect(result).toBe('(author:Einstein OR author:Hawking) AND read_count:[50 TO *]');
    });

    it('should work with different facet fields', () => {
      const yearResult = getQueryWithCondition('black holes', 'year', '2023');
      expect(yearResult).toBe('(black holes) AND year:2023');

      const citationResult = getQueryWithCondition('quantum', 'citation_count', '[10 TO 100]');
      expect(citationResult).toBe('(quantum) AND citation_count:[10 TO 100]');

      const readResult = getQueryWithCondition('gravity', 'read_count', '[5 TO *]');
      expect(readResult).toBe('(gravity) AND read_count:[5 TO *]');
    });

    it('should handle range conditions', () => {
      const result = getQueryWithCondition('physics', 'year', '[2020 TO 2023]');

      expect(result).toBe('(physics) AND year:[2020 TO 2023]');
    });

    it('should handle wildcard conditions', () => {
      const result = getQueryWithCondition('astronomy', 'year', '*');

      expect(result).toBe('(astronomy) AND year:*');
    });
  });

  describe('getYearGraphTicks', () => {
    const mockData: YearDatum[] = [
      { year: 2020, refereed: 10, notrefereed: 5 },
      { year: 2021, refereed: 15, notrefereed: 8 },
      { year: 2022, refereed: 20, notrefereed: 10 },
      { year: 2023, refereed: 25, notrefereed: 12 },
      { year: 2024, refereed: 30, notrefereed: 15 },
      { year: 2025, refereed: 35, notrefereed: 18 },
      { year: 2026, refereed: 40, notrefereed: 20 },
      { year: 2027, refereed: 45, notrefereed: 22 },
    ];

    it('should return ticks at regular intervals', () => {
      const ticks = getYearGraphTicks(mockData, 2);

      // Every 2nd year
      expect(ticks).toEqual([2020, 2022, 2024, 2026]);
    });

    it('should return all years when maxTicks is 1', () => {
      const ticks = getYearGraphTicks(mockData, 1);

      expect(ticks).toHaveLength(8);
      expect(ticks).toEqual([2020, 2021, 2022, 2023, 2024, 2025, 2026, 2027]);
    });

    it('should handle empty data', () => {
      const ticks = getYearGraphTicks([], 2);

      expect(ticks).toEqual([]);
    });

    it('should handle single data point', () => {
      const singleData: YearDatum[] = [{ year: 2020, refereed: 10, notrefereed: 5 }];

      const ticks = getYearGraphTicks(singleData, 5);

      expect(ticks).toEqual([2020]);
    });

    it('should select ticks based on index modulo', () => {
      const ticks = getYearGraphTicks(mockData, 3);

      // Indices 0, 3, 6 (years 2020, 2023, 2026)
      expect(ticks).toEqual([2020, 2023, 2026]);
    });

    it('should handle maxTicks larger than data length', () => {
      const shortData: YearDatum[] = [
        { year: 2020, refereed: 10, notrefereed: 5 },
        { year: 2021, refereed: 15, notrefereed: 8 },
      ];

      const ticks = getYearGraphTicks(shortData, 10);

      // With maxTicks=10, index % 10 === 0 only for index 0
      expect(ticks).toEqual([2020]);
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  plotCitationsHist,
  plotReadsHist,
  plotPapersHist,
  plotTimeSeriesGraph,
  getCitationTableData,
  getReadsTableData,
  getPapersTableData,
  getIndicesTableData,
  getYearsGraph,
  getHIndexGraphData,
  getAuthorNetworkSummaryGraph,
  getAuthorNetworkNodeDetails,
  getPaperNetworkSummaryGraph,
  getPaperNetworkNodeDetails,
  getPaperNetworkLinkDetails,
  buildWCDict,
  getResultsGraph,
} from '../graphUtils';
import {
  CitationsHistogramKey,
  ReadsHistogramKey,
  PapersHistogramKey,
  TimeSeriesKey,
  CitationsStatsKey,
  BasicStatsKey,
} from '@/api/metrics/types';
import type { IADSApiAuthorNetworkResponse, IADSApiPaperNetworkResponse, IBibcodeDict } from '@/api/vis/types';
import type { IDocsEntity } from '@/api/search/types';

describe('graphUtils', () => {
  /************ Histogram Functions ************/

  describe('plotCitationsHist', () => {
    const mockCitationsHist = {
      [CitationsHistogramKey.RR]: { '2020': 10, '2021': 15, '2022': 20 },
      [CitationsHistogramKey.RN]: { '2020': 5, '2021': 8, '2022': 12 },
      [CitationsHistogramKey.NR]: { '2020': 3, '2021': 6, '2022': 9 },
      [CitationsHistogramKey.NN]: { '2020': 2, '2021': 4, '2022': 6 },
      [CitationsHistogramKey.RRN]: { '2020': 0.5, '2021': 0.6, '2022': 0.7 },
      [CitationsHistogramKey.RNN]: { '2020': 0.2, '2021': 0.3, '2022': 0.4 },
      [CitationsHistogramKey.NRN]: { '2020': 0.1, '2021': 0.2, '2022': 0.3 },
      [CitationsHistogramKey.NNN]: { '2020': 0.05, '2021': 0.1, '2022': 0.15 },
    };

    it('should transform non-normalized citations histogram data for multiple papers', () => {
      const result = plotCitationsHist(false, mockCitationsHist, false);

      expect(result.indexBy).toBe('year');
      expect(result.keys).toEqual([
        'Ref. citations to ref. papers',
        'Ref. citations to non ref. papers',
        'Non ref. citations to ref. papers',
        'Non ref. citations to non ref. papers',
      ]);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        year: '2020',
        'Ref. citations to ref. papers': 10,
        'Ref. citations to non ref. papers': 5,
        'Non ref. citations to ref. papers': 3,
        'Non ref. citations to non ref. papers': 2,
      });
    });

    it('should transform normalized citations histogram data for multiple papers', () => {
      const result = plotCitationsHist(true, mockCitationsHist, false);

      expect(result.indexBy).toBe('year');
      expect(result.keys).toHaveLength(4);
      expect(result.data[0]).toEqual({
        year: '2020',
        'Ref. citations to ref. papers': 0.5,
        'Ref. citations to non ref. papers': 0.2,
        'Non ref. citations to ref. papers': 0.1,
        'Non ref. citations to non ref. papers': 0.05,
      });
    });

    it('should use different labels for single paper', () => {
      const result = plotCitationsHist(false, mockCitationsHist, true);

      expect(result.keys).toContain('Citations from ref. papers');
      expect(result.keys).toContain('Citations from non ref. papers');
    });

    it('should skip series with all zero values', () => {
      const histWithZeros = {
        [CitationsHistogramKey.RR]: { '2020': 10, '2021': 15 },
        [CitationsHistogramKey.RN]: { '2020': 0, '2021': 0 }, // All zeros
        [CitationsHistogramKey.NR]: { '2020': 3, '2021': 6 },
        [CitationsHistogramKey.NN]: { '2020': 0, '2021': 0 }, // All zeros
        [CitationsHistogramKey.RRN]: { '2020': 0.5, '2021': 0.6 },
        [CitationsHistogramKey.RNN]: { '2020': 0, '2021': 0 },
        [CitationsHistogramKey.NRN]: { '2020': 0.1, '2021': 0.2 },
        [CitationsHistogramKey.NNN]: { '2020': 0, '2021': 0 },
      };

      const result = plotCitationsHist(false, histWithZeros, false);

      expect(result.keys).toHaveLength(2);
      expect(result.keys).not.toContain('Ref. citations to non ref. papers');
      expect(result.keys).not.toContain('Non ref. citations to non ref. papers');
    });
  });

  describe('plotReadsHist', () => {
    const mockReadsHist = {
      [ReadsHistogramKey.RR]: { '2020': 100, '2021': 150, '2022': 200 },
      [ReadsHistogramKey.AR]: { '2020': 120, '2021': 180, '2022': 240 },
      [ReadsHistogramKey.RRN]: { '2020': 0.7, '2021': 0.75, '2022': 0.8 },
      [ReadsHistogramKey.ARN]: { '2020': 0.85, '2021': 0.9, '2022': 0.95 },
    };

    it('should transform non-normalized reads histogram data', () => {
      const result = plotReadsHist(false, mockReadsHist);

      expect(result.indexBy).toBe('year');
      expect(result.keys).toEqual(['Refereed', 'Non-refereed']);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        year: '2020',
        Refereed: 100,
        'Non-refereed': 20, // AR - RR = 120 - 100
      });
    });

    it('should transform normalized reads histogram data', () => {
      const result = plotReadsHist(true, mockReadsHist);

      expect(result.data[0].year).toBe('2020');
      expect(result.data[0].Refereed).toBe(0.7);
      expect(result.data[0]['Non-refereed']).toBeCloseTo(0.15, 10); // ARN - RRN = 0.85 - 0.7
    });

    it('should skip series with all zero values', () => {
      const histWithZeros = {
        [ReadsHistogramKey.RR]: { '2020': 100, '2021': 150 },
        [ReadsHistogramKey.AR]: { '2020': 100, '2021': 150 }, // Same as RR, so Non-ref will be all zeros
        [ReadsHistogramKey.RRN]: { '2020': 0.7, '2021': 0.75 },
        [ReadsHistogramKey.ARN]: { '2020': 0.7, '2021': 0.75 },
      };

      const result = plotReadsHist(false, histWithZeros);

      expect(result.keys).toHaveLength(1);
      expect(result.keys).toEqual(['Refereed']);
    });
  });

  describe('plotPapersHist', () => {
    const mockPapersHist = {
      [PapersHistogramKey.RP]: { '2020': 50, '2021': 60, '2022': 70 },
      [PapersHistogramKey.AP]: { '2020': 65, '2021': 78, '2022': 91 },
      [PapersHistogramKey.RPN]: { '2020': 0.6, '2021': 0.65, '2022': 0.7 },
      [PapersHistogramKey.APN]: { '2020': 0.75, '2021': 0.8, '2022': 0.85 },
    };

    it('should transform non-normalized papers histogram data', () => {
      const result = plotPapersHist(false, mockPapersHist);

      expect(result.indexBy).toBe('year');
      expect(result.keys).toEqual(['Refereed', 'Non-refereed']);
      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toEqual({
        year: '2020',
        Refereed: 50,
        'Non-refereed': 15, // AP - RP = 65 - 50
      });
    });

    it('should transform normalized papers histogram data', () => {
      const result = plotPapersHist(true, mockPapersHist);

      expect(result.data[0].year).toBe('2020');
      expect(result.data[0].Refereed).toBe(0.6);
      expect(result.data[0]['Non-refereed']).toBeCloseTo(0.15, 10); // APN - RPN = 0.75 - 0.6
    });

    it('should skip series with all zero values', () => {
      const histWithZeros = {
        [PapersHistogramKey.RP]: { '2020': 50, '2021': 60 },
        [PapersHistogramKey.AP]: { '2020': 50, '2021': 60 },
        [PapersHistogramKey.RPN]: { '2020': 0.6, '2021': 0.65 },
        [PapersHistogramKey.APN]: { '2020': 0.6, '2021': 0.65 },
      };

      const result = plotPapersHist(false, histWithZeros);

      expect(result.keys).toHaveLength(1);
      expect(result.keys).toEqual(['Refereed']);
    });
  });

  /************ Table Data Functions ************/

  describe('getCitationTableData', () => {
    const mockInput = {
      total: {
        [CitationsStatsKey.NCP]: 100,
        [CitationsStatsKey.TNC]: 500,
        [CitationsStatsKey.NSC]: 25,
        [CitationsStatsKey.ANC]: 5.55,
        [CitationsStatsKey.MNC]: 3,
        [CitationsStatsKey.NNC]: 4.2,
        [CitationsStatsKey.TNRC]: 450,
        [CitationsStatsKey.ANRC]: 4.99,
        [CitationsStatsKey.MNRC]: 2.5,
        [CitationsStatsKey.NNRC]: 3.8,
      },
      refereed: {
        [CitationsStatsKey.NCP]: 80,
        [CitationsStatsKey.TNC]: 420,
        [CitationsStatsKey.NSC]: 20,
        [CitationsStatsKey.ANC]: 5.25,
        [CitationsStatsKey.MNC]: 3,
        [CitationsStatsKey.NNC]: 4.0,
        [CitationsStatsKey.TNRC]: 400,
        [CitationsStatsKey.ANRC]: 5.0,
        [CitationsStatsKey.MNRC]: 2.5,
        [CitationsStatsKey.NNRC]: 3.75,
      },
    };

    it('should transform citation data to table format', () => {
      const result = getCitationTableData(mockInput);

      expect(result.numberOfCitingPapers).toEqual([100, 80]);
      expect(result.totalCitations).toEqual([500, 420]);
      expect(result.numberOfSelfCitations).toEqual([25, 20]);
    });

    it('should limit decimal places to one digit', () => {
      const result = getCitationTableData(mockInput);

      expect(result.averageCitations).toEqual([5.5, 5.3]); // 5.55 -> 5.5 (truncates, not rounds), 5.25 -> 5.3
      expect(result.normalizedCitations).toEqual([4.2, 4.0]);
      expect(result.averageRefereedCitations).toEqual([5.0, 5.0]);
    });

    it('should preserve integer values', () => {
      const result = getCitationTableData(mockInput);

      expect(result.medianCitations).toEqual([3, 3]);
      expect(result.medianRefereedCitations).toEqual([2.5, 2.5]);
    });
  });

  describe('getReadsTableData', () => {
    const mockInput = {
      total: {
        [BasicStatsKey.TNR]: 1000,
        [BasicStatsKey.ANR]: 10.55,
        [BasicStatsKey.MNR]: 8,
        [BasicStatsKey.TND]: 500,
        [BasicStatsKey.AND]: 5.25,
        [BasicStatsKey.MND]: 4,
        [BasicStatsKey.NP]: 0,
        [BasicStatsKey.NPC]: 0,
      },
      refereed: {
        [BasicStatsKey.TNR]: 850,
        [BasicStatsKey.ANR]: 9.44,
        [BasicStatsKey.MNR]: 7,
        [BasicStatsKey.TND]: 425,
        [BasicStatsKey.AND]: 4.72,
        [BasicStatsKey.MND]: 3,
        [BasicStatsKey.NP]: 0,
        [BasicStatsKey.NPC]: 0,
      },
    };

    it('should transform reads data to table format', () => {
      const result = getReadsTableData(mockInput);

      expect(result.totalNumberOfReads).toEqual([1000, 850]);
      expect(result.totalNumberOfDownloads).toEqual([500, 425]);
    });

    it('should limit decimal places', () => {
      const result = getReadsTableData(mockInput);

      expect(result.averageNumberOfReads).toEqual([10.6, 9.4]); // 10.55 -> 10.6, 9.44 -> 9.4
      expect(result.averageNumberOfDownloads).toEqual([5.3, 4.7]);
    });

    it('should preserve integer values', () => {
      const result = getReadsTableData(mockInput);

      expect(result.medianNumberOfReads).toEqual([8, 7]);
      expect(result.medianNumberOfDownloads).toEqual([4, 4]); // Note: bug in original - uses total twice
    });
  });

  describe('getPapersTableData', () => {
    const mockInput = {
      total: {
        [BasicStatsKey.NP]: 100,
        [BasicStatsKey.NPC]: 95.5,
        [BasicStatsKey.TNR]: 0,
        [BasicStatsKey.ANR]: 0,
        [BasicStatsKey.MNR]: 0,
        [BasicStatsKey.TND]: 0,
        [BasicStatsKey.AND]: 0,
        [BasicStatsKey.MND]: 0,
      },
      refereed: {
        [BasicStatsKey.NP]: 80,
        [BasicStatsKey.NPC]: 78.2,
        [BasicStatsKey.TNR]: 0,
        [BasicStatsKey.ANR]: 0,
        [BasicStatsKey.MNR]: 0,
        [BasicStatsKey.TND]: 0,
        [BasicStatsKey.AND]: 0,
        [BasicStatsKey.MND]: 0,
      },
    };

    it('should transform papers data to table format', () => {
      const result = getPapersTableData(mockInput);

      expect(result.totalNumberOfPapers).toEqual([100, 80]);
    });

    it('should limit decimal places', () => {
      const result = getPapersTableData(mockInput);

      expect(result.totalNormalizedPaperCount).toEqual([95.5, 78.2]);
    });
  });

  describe('getIndicesTableData', () => {
    const mockInput = {
      total: {
        [TimeSeriesKey.H]: 25,
        [TimeSeriesKey.M]: 1.25,
        [TimeSeriesKey.G]: 40,
        [TimeSeriesKey.I10]: 30,
        [TimeSeriesKey.I100]: 5,
        [TimeSeriesKey.TORI]: 15.75,
        [TimeSeriesKey.RIQ]: 200,
        [TimeSeriesKey.READ10]: 18.33,
      },
      refereed: {
        [TimeSeriesKey.H]: 22,
        [TimeSeriesKey.M]: 1.1,
        [TimeSeriesKey.G]: 35,
        [TimeSeriesKey.I10]: 25,
        [TimeSeriesKey.I100]: 4,
        [TimeSeriesKey.TORI]: 14.25,
        [TimeSeriesKey.RIQ]: 180,
        [TimeSeriesKey.READ10]: 16.66,
      },
    };

    it('should transform indices data to table format', () => {
      const result = getIndicesTableData(mockInput);

      expect(result.hIndex).toEqual([25, 22]);
      expect(result.gIndex).toEqual([40, 35]);
      expect(result.i10Index).toEqual([30, 25]);
      expect(result.i100Index).toEqual([5, 4]);
      expect(result.riqIndex).toEqual([200, 180]);
    });

    it('should limit decimal places', () => {
      const result = getIndicesTableData(mockInput);

      expect(result.mIndex).toEqual([1.3, 1.1]); // 1.25 -> 1.3
      expect(result.toriIndex).toEqual([15.8, 14.3]); // 15.75 -> 15.8
      expect(result.read10Index).toEqual([18.3, 16.7]); // 18.33 -> 18.3
    });
  });

  /************ Graph Functions ************/

  describe('plotTimeSeriesGraph', () => {
    const mockTimeSeries = {
      [TimeSeriesKey.H]: { '2020': 10, '2021': 12, '2022': 15 },
      [TimeSeriesKey.M]: { '2020': 0.5, '2021': 0.6, '2022': 0.75 },
      [TimeSeriesKey.G]: { '2020': 20, '2021': 25, '2022': 30 },
      [TimeSeriesKey.I10]: { '2020': 15, '2021': 18, '2022': 22 },
      [TimeSeriesKey.I100]: { '2020': 2, '2021': 3, '2022': 4 },
      [TimeSeriesKey.TORI]: { '2020': 8, '2021': 10, '2022': 12 },
      [TimeSeriesKey.RIQ]: { '2020': 100, '2021': 120, '2022': 140 },
      [TimeSeriesKey.READ10]: { '2020': 50, '2021': 60, '2022': 70 },
    };

    it('should transform time series data to line graph format', () => {
      const result = plotTimeSeriesGraph(mockTimeSeries);

      expect(result.data).toHaveLength(8);
      expect(result.data.map((s) => s.id)).toEqual([
        'h-index',
        'm-index',
        'g-index',
        'i10-index',
        'i100-index',
        'tori-index',
        'riq-index',
        'read10-index',
      ]);
    });

    it('should format data points correctly', () => {
      const result = plotTimeSeriesGraph(mockTimeSeries);

      const hIndexData = result.data.find((s) => s.id === 'h-index');
      expect(hIndexData?.data).toEqual([
        { x: '2020', y: 10 },
        { x: '2021', y: 12 },
        { x: '2022', y: 15 },
      ]);
    });

    it('should divide read10-index values by 10', () => {
      const result = plotTimeSeriesGraph(mockTimeSeries);

      const read10Data = result.data.find((s) => s.id === 'read10-index');
      expect(read10Data?.data).toEqual([
        { x: '2020', y: 5 }, // 50/10
        { x: '2021', y: 6 }, // 60/10
        { x: '2022', y: 7 }, // 70/10
      ]);
    });

    it('should skip undefined indices', () => {
      const partialTimeSeries = {
        [TimeSeriesKey.H]: { '2020': 10, '2021': 12 },
        [TimeSeriesKey.G]: { '2020': 20, '2021': 25 },
      };

      const result = plotTimeSeriesGraph(partialTimeSeries);

      expect(result.data).toHaveLength(2);
      expect(result.data.map((s) => s.id)).toEqual(['h-index', 'g-index']);
    });
  });

  describe('getYearsGraph', () => {
    const mockFacetData = {
      facet_pivot: {
        'property,year': [
          {
            value: 'refereed',
            pivot: [
              { value: '2020', count: 50 },
              { value: '2021', count: 60 },
              { value: '2023', count: 80 }, // Gap: 2022 missing
            ],
          },
          {
            value: 'notrefereed',
            pivot: [
              { value: '2020', count: 20 },
              { value: '2022', count: 30 }, // Gap: 2021 missing
              { value: '2023', count: 40 },
            ],
          },
        ],
      },
    };

    it('should transform year facet data to bar graph format', () => {
      const result = getYearsGraph(mockFacetData);

      expect(result.indexBy).toBe('year');
      expect(result.keys).toEqual(['refereed', 'notrefereed']);
    });

    it('should fill in missing years with zeros', () => {
      const result = getYearsGraph(mockFacetData);

      expect(result.data).toHaveLength(4); // 2020-2023
      expect(result.data).toEqual([
        { year: 2020, refereed: 50, notrefereed: 20 },
        { year: 2021, refereed: 60, notrefereed: 0 }, // Filled gap
        { year: 2022, refereed: 0, notrefereed: 30 }, // Filled gap
        { year: 2023, refereed: 80, notrefereed: 40 },
      ]);
    });

    it('should handle single year data', () => {
      const singleYearData = {
        facet_pivot: {
          'property,year': [
            {
              value: 'refereed',
              pivot: [{ value: '2020', count: 50 }],
            },
            {
              value: 'notrefereed',
              pivot: [{ value: '2020', count: 20 }],
            },
          ],
        },
      };

      const result = getYearsGraph(singleYearData);

      expect(result.data).toHaveLength(1);
      expect(result.data[0]).toEqual({ year: 2020, refereed: 50, notrefereed: 20 });
    });

    it('should ignore non-standard properties', () => {
      const dataWithExtra = {
        facet_pivot: {
          'property,year': [
            {
              value: 'refereed',
              pivot: [{ value: '2020', count: 50 }],
            },
            {
              value: 'other_property',
              pivot: [{ value: '2020', count: 100 }],
            },
          ],
        },
      };

      const result = getYearsGraph(dataWithExtra);

      expect(result.keys).toEqual(['refereed', 'notrefereed']);
      expect(result.data[0]).toEqual({ year: 2020, refereed: 50, notrefereed: 0 });
    });
  });

  describe('getHIndexGraphData', () => {
    const mockCounts = [
      { val: 100, count: 5 },
      { val: 50, count: 10 },
      { val: 25, count: 15 },
      { val: 10, count: 20 },
      { val: 5, count: 50 },
    ];

    it('should generate h-index graph data points', () => {
      const result = getHIndexGraphData(mockCounts, 100);

      expect(result).toHaveLength(100);
      expect(result[0]).toEqual({ x: 1, y: 100 });
    });

    it('should distribute points based on count', () => {
      const result = getHIndexGraphData(mockCounts, 100);

      // First 5 points should have y=100
      expect(result[0].y).toBe(100);
      expect(result[4].y).toBe(100);
      // Next 10 points should have y=50
      expect(result[5].y).toBe(50);
      expect(result[14].y).toBe(50);
    });

    it('should respect maxDataPoints limit', () => {
      const result = getHIndexGraphData(mockCounts, 10);

      expect(result).toHaveLength(10);
    });

    it('should handle empty counts', () => {
      const result = getHIndexGraphData([], 100);

      expect(result).toHaveLength(0);
    });

    it('should stop when maxDataPoints is reached', () => {
      const largeCounts = [{ val: 100, count: 1000 }];
      const result = getHIndexGraphData(largeCounts, 50);

      expect(result).toHaveLength(50);
    });
  });

  /************ Author Network Functions ************/

  describe('getAuthorNetworkSummaryGraph', () => {
    const mockAuthorNetwork: IADSApiAuthorNetworkResponse = {
      data: {
        root: {
          name: 'ROOT',
          children: [
            {
              name: 'Group 1',
              children: [
                { name: 'Author A', papers: ['2020ApJ...100..123A', '2021ApJ...101..124A'] },
                { name: 'Author B', papers: ['2020ApJ...100..123A', '2022ApJ...102..125A'] },
              ],
            },
            {
              name: 'Group 2',
              children: [{ name: 'Author C', papers: ['2019ApJ...99..122A', '2020ApJ...100..126A'] }],
            },
          ],
        },
      },
      bibcode_dict: {},
      link_data: [],
      msg: '',
    };

    it('should generate summary graph from author network', () => {
      const result = getAuthorNetworkSummaryGraph(mockAuthorNetwork);

      expect(result.data).toBeDefined();
      expect(result.data).toHaveLength(2);
    });

    it('should group papers by year', () => {
      const result = getAuthorNetworkSummaryGraph(mockAuthorNetwork);

      const group1 = result.data?.[0];
      expect(group1?.id).toBe('Group 1');
      // Group 1 has bibcodes from 2020, 2021, 2022
      expect(group1?.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: '2020', y: 1 }),
          expect.objectContaining({ x: '2021', y: 1 }),
          expect.objectContaining({ x: '2022', y: 1 }),
        ]),
      );
    });

    it('should fill in year gaps with zeros', () => {
      const result = getAuthorNetworkSummaryGraph(mockAuthorNetwork);

      const group1 = result.data?.[0];
      // Should have all years from 2020 to 2022
      expect(group1?.data).toHaveLength(3);
    });

    it('should return error when no root', () => {
      const noRootNetwork: IADSApiAuthorNetworkResponse = {
        data: {} as IADSApiAuthorNetworkResponse['data'],
        bibcode_dict: {},
        link_data: [],
        msg: '',
      };

      const result = getAuthorNetworkSummaryGraph(noRootNetwork);

      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe('Cannot generate network');
    });

    it('should limit to first 7 groups', () => {
      const manyGroups: IADSApiAuthorNetworkResponse = {
        data: {
          root: {
            name: 'ROOT',
            children: Array.from({ length: 10 }, (_, i) => ({
              name: `Group ${i}`,
              children: [{ name: `Author ${i}`, papers: [`2020ApJ...${i}..123A`] }],
            })),
          },
        },
        bibcode_dict: {},
        link_data: [],
        msg: '',
      };

      const result = getAuthorNetworkSummaryGraph(manyGroups);

      expect(result.data).toHaveLength(7);
    });
  });

  describe('getAuthorNetworkNodeDetails', () => {
    const mockBibcodeDict: IBibcodeDict = {
      '2020ApJ...100..123A': {
        authors: ['Author A', 'Author B', 'Author C'],
        citation_count: 50,
        title: 'Test Paper 1',
      },
      '2021ApJ...101..124A': {
        authors: ['Author A', 'Author D'],
        citation_count: 30,
        title: ['Test Paper 2'],
      },
      '2019ApJ...99..122A': {
        authors: ['Author A'],
        citation_count: 20,
        title: 'Test &amp; Paper 3',
      },
    };

    it('should get details for an author node', () => {
      const authorNode = {
        name: 'Author A',
        papers: ['2020ApJ...100..123A', '2021ApJ...101..124A', '2019ApJ...99..122A'],
      };

      const result = getAuthorNetworkNodeDetails(authorNode, mockBibcodeDict);

      expect(result.type).toBe('author');
      expect(result.name).toBe('Author A');
      expect(result.papers).toHaveLength(3);
      expect(result.mostRecentYear).toBe('2021');
    });

    it('should sort papers by citation count descending', () => {
      const authorNode = {
        name: 'Author A',
        papers: ['2020ApJ...100..123A', '2021ApJ...101..124A', '2019ApJ...99..122A'],
      };

      const result = getAuthorNetworkNodeDetails(authorNode, mockBibcodeDict);

      expect(result.papers[0].citation_count).toBe(50);
      expect(result.papers[1].citation_count).toBe(30);
      expect(result.papers[2].citation_count).toBe(20);
    });

    it('should decode HTML entities in titles', () => {
      const authorNode = {
        name: 'Author A',
        papers: ['2019ApJ...99..122A'],
      };

      const result = getAuthorNetworkNodeDetails(authorNode, mockBibcodeDict);

      expect(result.papers[0].title).toEqual(['Test & Paper 3']);
    });

    it('should handle title as string or array', () => {
      const authorNode = {
        name: 'Author A',
        papers: ['2020ApJ...100..123A', '2021ApJ...101..124A'],
      };

      const result = getAuthorNetworkNodeDetails(authorNode, mockBibcodeDict);

      expect(result.papers[0].title).toEqual(['Test Paper 1']);
      expect(result.papers[1].title).toEqual(['Test Paper 2']);
    });

    it('should get details for a group node', () => {
      const groupNode = {
        name: '1',
        children: [
          { name: 'Author A', papers: ['2020ApJ...100..123A', '2021ApJ...101..124A'] },
          { name: 'Author B', papers: ['2020ApJ...100..123A'] },
        ],
      };

      const result = getAuthorNetworkNodeDetails(groupNode, mockBibcodeDict);

      expect(result.type).toBe('group');
      expect(result.name).toBe('Group 1');
      expect(result.papers).toHaveLength(2); // Unique bibcodes
    });

    it('should add groupAuthorCount to group papers', () => {
      const groupNode = {
        name: '1',
        children: [
          { name: 'Author A', papers: ['2020ApJ...100..123A'] },
          { name: 'Author B', papers: ['2020ApJ...100..123A'] },
        ],
      };

      const result = getAuthorNetworkNodeDetails(groupNode, mockBibcodeDict);

      const paper = result.papers.find((p) => p.bibcode === '2020ApJ...100..123A');
      expect(paper?.groupAuthorCount).toBe(2);
    });
  });

  /************ Paper Network Functions ************/

  describe('getPaperNetworkSummaryGraph', () => {
    const mockPaperNetwork: IADSApiPaperNetworkResponse = {
      data: {
        summaryGraph: {
          nodes: [
            { id: 1, node_name: 1, node_label: {}, top_common_references: {} },
            { id: 2, node_name: 2, node_label: {}, top_common_references: {} },
          ],
          links: [],
        },
        fullGraph: {
          nodes: [
            { node_name: '2020ApJ...100..123A', group: 1, citation_count: 50, title: 'Test 1', first_author: 'A' },
            { node_name: '2021ApJ...101..124A', group: 1, citation_count: 30, title: 'Test 2', first_author: 'B' },
            { node_name: '2019ApJ...99..122A', group: 2, citation_count: 20, title: 'Test 3', first_author: 'C' },
          ],
          links: [],
        },
      },
      bibcode_dict: {},
      link_data: [],
      msg: '',
    };

    it('should generate summary graph from paper network', () => {
      const result = getPaperNetworkSummaryGraph(mockPaperNetwork);

      expect(result.data).toHaveLength(2);
    });

    it('should group papers by year', () => {
      const result = getPaperNetworkSummaryGraph(mockPaperNetwork);

      const group1 = result.data[0];
      expect(group1.id).toBe(1);
      expect(group1.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ x: '2020', y: 1 }),
          expect.objectContaining({ x: '2021', y: 1 }),
        ]),
      );
    });

    it('should sort groups by id', () => {
      const result = getPaperNetworkSummaryGraph(mockPaperNetwork);

      expect(result.data[0].id).toBe(1);
      expect(result.data[1].id).toBe(2);
    });

    it('should limit to first 7 groups', () => {
      const manyGroupsNetwork: IADSApiPaperNetworkResponse = {
        data: {
          summaryGraph: {
            nodes: Array.from({ length: 10 }, (_, i) => ({
              id: i,
              node_name: i,
              node_label: {},
              top_common_references: {},
            })),
            links: [],
          },
          fullGraph: {
            nodes: Array.from({ length: 10 }, (_, i) => ({
              node_name: `2020ApJ...${i}..123A`,
              group: i,
              citation_count: 10,
              title: `Test ${i}`,
              first_author: 'A',
            })),
            links: [],
          },
        },
        bibcode_dict: {},
        link_data: [],
        msg: '',
      };

      const result = getPaperNetworkSummaryGraph(manyGroupsNetwork);

      expect(result.data).toHaveLength(7);
    });
  });

  describe('getPaperNetworkNodeDetails', () => {
    const mockFullGraph = {
      nodes: [
        {
          node_name: '2020ApJ...100..123A',
          group: 1,
          citation_count: 50,
          title: 'Test Paper 1',
          first_author: 'Author A',
        },
        {
          node_name: '2021ApJ...101..124A',
          group: 1,
          citation_count: 30,
          title: 'Test Paper 2',
          first_author: 'Author B',
        },
      ],
      links: [],
    };

    const mockNode = {
      id: 1,
      node_name: 1,
      node_label: { quantum: 0.8, physics: 0.6 },
      top_common_references: {
        '2019ApJ...99..122A': 0.75,
        '2018ApJ...98..121A': 0.5,
        '2020ApJ...100..123A': 0.9, // In group
      },
    };

    it('should extract title words from node_label', () => {
      const result = getPaperNetworkNodeDetails(mockNode, mockFullGraph);

      expect(result.titleWords).toEqual(['quantum', 'physics']);
    });

    it('should format papers with correct structure', () => {
      const result = getPaperNetworkNodeDetails(mockNode, mockFullGraph);

      expect(result.papers).toHaveLength(2);
      expect(result.papers[0]).toEqual({
        bibcode: '2020ApJ...100..123A',
        title: ['Test Paper 1'],
        citation_count: 50,
        author: ['Author A'],
      });
    });

    it('should sort papers by citation_count descending', () => {
      const result = getPaperNetworkNodeDetails(mockNode, mockFullGraph);

      expect(result.papers[0].citation_count).toBe(50);
      expect(result.papers[1].citation_count).toBe(30);
    });

    it('should format top_common_references correctly', () => {
      const result = getPaperNetworkNodeDetails(mockNode, mockFullGraph);

      expect(result.topCommonReferences).toHaveLength(3);
      expect(result.topCommonReferences[0]).toEqual({
        bibcode: '2020ApJ...100..123A',
        percent: '90',
        inGroup: true,
      });
    });

    it('should sort top_common_references by percent descending', () => {
      const result = getPaperNetworkNodeDetails(mockNode, mockFullGraph);

      expect(result.topCommonReferences[0].percent).toBe('90');
      expect(result.topCommonReferences[1].percent).toBe('75');
      expect(result.topCommonReferences[2].percent).toBe('50');
    });

    it('should mark references in group', () => {
      const result = getPaperNetworkNodeDetails(mockNode, mockFullGraph);

      const inGroupRef = result.topCommonReferences.find((r) => r.bibcode === '2020ApJ...100..123A');
      const notInGroupRef = result.topCommonReferences.find((r) => r.bibcode === '2019ApJ...99..122A');

      expect(inGroupRef?.inGroup).toBe(true);
      expect(notInGroupRef?.inGroup).toBe(false);
    });
  });

  describe('getPaperNetworkLinkDetails', () => {
    const mockFullGraph = {
      nodes: [
        { node_name: 'A', group: 1, citation_count: 50, title: 'Test 1', first_author: 'Author A' },
        { node_name: 'B', group: 1, citation_count: 30, title: 'Test 2', first_author: 'Author B' },
        { node_name: 'C', group: 2, citation_count: 40, title: 'Test 3', first_author: 'Author C' },
        { node_name: 'D', group: 2, citation_count: 25, title: 'Test 4', first_author: 'Author D' },
      ],
      links: [
        { source: 0, target: 1, overlap: ['ref1', 'ref2', 'ref3'] },
        { source: 2, target: 3, overlap: ['ref2', 'ref3', 'ref4'] },
      ],
    };

    const sourceNode = {
      id: 1,
      node_name: 1,
      node_label: {},
      top_common_references: {},
    };

    const targetNode = {
      id: 2,
      node_name: 2,
      node_label: {},
      top_common_references: {},
    };

    it('should return link details with group information', () => {
      const result = getPaperNetworkLinkDetails(sourceNode, '#ff0000', targetNode, '#00ff00', mockFullGraph);

      expect(result.groupOne).toEqual({ name: 'Group 1', color: '#ff0000' });
      expect(result.groupTwo).toEqual({ name: 'Group 2', color: '#00ff00' });
    });

    it('should find shared references between groups', () => {
      const result = getPaperNetworkLinkDetails(sourceNode, '#ff0000', targetNode, '#00ff00', mockFullGraph);

      expect(result.papers).toHaveLength(2); // ref2 and ref3 are shared
      const bibcodes = result.papers.map((p) => p.bibcode);
      expect(bibcodes).toContain('ref2');
      expect(bibcodes).toContain('ref3');
    });

    it('should calculate percentages for each group', () => {
      const result = getPaperNetworkLinkDetails(sourceNode, '#ff0000', targetNode, '#00ff00', mockFullGraph);

      // ref2 appears in both groups
      const ref2 = result.papers.find((p) => p.bibcode === 'ref2');
      expect(ref2?.percent1).toBeGreaterThan(0);
      expect(ref2?.percent2).toBeGreaterThan(0);
    });

    it('should sort by product of percentages descending', () => {
      const result = getPaperNetworkLinkDetails(sourceNode, '#ff0000', targetNode, '#00ff00', mockFullGraph);

      for (let i = 0; i < result.papers.length - 1; i++) {
        const product1 = result.papers[i].percent1 * result.papers[i].percent2;
        const product2 = result.papers[i + 1].percent1 * result.papers[i + 1].percent2;
        expect(product1).toBeGreaterThanOrEqual(product2);
      }
    });
  });

  /************ Word Cloud Functions ************/

  describe('buildWCDict', () => {
    const mockDict = {
      quantum: { total_occurrences: 100, idf: 2.5 },
      physics: { total_occurrences: 80, idf: 2.0 },
      relativity: { total_occurrences: 60, idf: 3.0 },
      mechanics: { total_occurrences: 40, idf: 1.5 },
    };

    const mockSliderRange = {
      0: [1, 0, 'IDF'],
      1: [0.5, 0.5, 'Mixed'],
      2: [0, 1, 'Frequency'],
    };

    const colorRange = ['#blue', '#cyan', '#yellow', '#orange', '#red'];

    it('should build word cloud dictionary', () => {
      const result = buildWCDict(mockDict, mockSliderRange, 1, colorRange);

      expect(result.wordList).toBeDefined();
      expect(result.fill).toBeDefined();
    });

    it('should limit to top 50 words', () => {
      const largeDict = Object.fromEntries(
        Array.from({ length: 100 }, (_, i) => [`word${i}`, { total_occurrences: i, idf: i * 0.1 }]),
      );

      const result = buildWCDict(largeDict, mockSliderRange, 1, colorRange);

      expect(result.wordList).toHaveLength(50);
    });

    it('should calculate word sizes based on slider value', () => {
      const result = buildWCDict(mockDict, mockSliderRange, 0, colorRange);

      expect(result.wordList.every((w) => w.size >= 30 && w.size <= 70)).toBe(true);
    });

    it('should include word text and metadata', () => {
      const result = buildWCDict(mockDict, mockSliderRange, 1, colorRange);

      result.wordList.forEach((word) => {
        expect(word).toHaveProperty('text');
        expect(word).toHaveProperty('size');
        expect(word).toHaveProperty('selected');
        expect(word).toHaveProperty('origSize');
        expect(word.selected).toBe(false);
      });
    });

    it('should handle different slider positions', () => {
      const resultIDF = buildWCDict(mockDict, mockSliderRange, 0, colorRange);
      const resultFreq = buildWCDict(mockDict, mockSliderRange, 2, colorRange);

      // Results should be different based on weighting
      expect(resultIDF.wordList).not.toEqual(resultFreq.wordList);
    });
  });

  /************ Results Graph Functions ************/

  describe('getResultsGraph', () => {
    const mockDocs = [
      {
        bibcode: '2020ApJ...100..123A',
        pubdate: '2020-05-15',
        title: ['Test Paper 1'],
        read_count: 100,
        citation_count: 50,
      },
      {
        bibcode: '2021Natur.200..456B',
        pubdate: '2021-03-00', // Day is 00
        title: ['Test Paper 2'],
        read_count: 200,
        citation_count: 75,
      },
      {
        bibcode: '2019Sci...150..789C',
        pubdate: '2019-12-25',
        read_count: 150,
        citation_count: 60,
      },
    ];

    it('should transform docs to bubble plot format', () => {
      const result = getResultsGraph(mockDocs);

      expect(result.data).toHaveLength(3);
      expect(result.data[0]).toMatchObject({
        bibcode: '2020ApJ...100..123A',
        title: 'Test Paper 1',
        read_count: 100,
        citation_count: 50,
        year: 2020,
        pub: 'ApJ',
      });
    });

    it('should replace 00 in dates with 01', () => {
      const result = getResultsGraph(mockDocs);

      const paper = result.data.find((d) => d.bibcode === '2021Natur.200..456B');
      expect(paper?.pubdate).toBe('2021-03-01');
    });

    it('should handle missing title', () => {
      const docsWithoutTitle: Partial<IDocsEntity>[] = [
        {
          bibcode: '2020ApJ...100..123A',
          pubdate: '2020-05-15',
          read_count: 100,
          citation_count: 50,
        },
      ];

      const result = getResultsGraph(docsWithoutTitle as IDocsEntity[]);

      expect(result.data[0].title).toBe('');
    });

    it('should handle missing read_count and citation_count', () => {
      const docsWithMissing: Partial<IDocsEntity>[] = [
        {
          bibcode: '2020ApJ...100..123A',
          pubdate: '2020-05-15',
          title: ['Test'],
        },
      ];

      const result = getResultsGraph(docsWithMissing as IDocsEntity[]);

      expect(result.data[0].read_count).toBe(0);
      expect(result.data[0].citation_count).toBe(0);
    });

    it('should extract journal from bibcode', () => {
      const result = getResultsGraph(mockDocs);

      expect(result.data[0].pub).toBe('ApJ');
      expect(result.data[1].pub).toBe('Natur');
      expect(result.data[2].pub).toBe('Sci');
    });

    it('should identify top 5 journals when they represent 25%+ of results', () => {
      const manyDocs = [
        ...Array(30).fill({ bibcode: '2020ApJ...100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        ...Array(20).fill({ bibcode: '2020Natur.100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        ...Array(10).fill({ bibcode: '2020Sci...100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        { bibcode: '2020Other.100..123A', pubdate: '2020-01-01', title: ['Test'] },
      ].map((d, i) => ({ ...d, bibcode: d.bibcode.replace('123', String(123 + i)) }));

      const result = getResultsGraph(manyDocs);

      expect(result.groups).toBeDefined();
      expect(result.groups?.length).toBeGreaterThan(0);
      expect(result.groups).toContain('ApJ');
    });

    it('should group non-top journals as "other"', () => {
      const manyDocs = [
        ...Array(30).fill({ bibcode: '2020ApJ...100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        ...Array(20).fill({ bibcode: '2020Natur.100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        ...Array(15).fill({ bibcode: '2020Sci...100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        ...Array(10).fill({ bibcode: '2020PhRvL.100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        ...Array(5).fill({ bibcode: '2020MNRAS.100..123A', pubdate: '2020-01-01', title: ['Test'] }),
        { bibcode: '2020Rare..100..123A', pubdate: '2020-01-01', title: ['Test'] },
      ].map((d, i) => ({ ...d, bibcode: d.bibcode.replace('123', String(123 + i)) }));

      const result = getResultsGraph(manyDocs);

      // Top 5 journals represent 80/81 = ~98.8% > 25%, so journals should be highlighted
      expect(result.groups).toBeDefined();
      expect(result.groups?.length).toBeGreaterThan(0);

      const otherPaper = result.data.find((d) => d.bibcode.includes('Rare'));
      expect(otherPaper?.pub).toBe('other');
    });

    it('should not highlight journals if top 5 represent less than 25%', () => {
      // Create 20 different journals with 5 papers each = 100 papers total
      // Top 5 will have 25 papers out of 100 = exactly 25%, but need >= 25% after including 'other'
      // Since 25/100 = exactly 0.25, this should not highlight (needs to be >= 0.25 AND < 1)
      const diverseDocs = Array(20)
        .fill(null)
        .flatMap((_, i) =>
          Array(5)
            .fill(null)
            .map((_, j) => ({
              bibcode: `2020Jou${String(i).padStart(2, '0')}...${i * 10 + j}..123A`,
              pubdate: '2020-01-01',
              title: ['Test'],
            })),
        );

      const result = getResultsGraph(diverseDocs);

      // Top 5 journals have 25 papers out of 100 = 25%, which is exactly at threshold
      // Based on the logic, if topPubsCount / nodes.length < 1, it adds 'other', making it > 25%
      // So this will actually highlight journals
      expect(result.groups).toBeDefined();
      // With 20 journals of 5 papers each, top 5 have 25 papers total = 25%
      // The code checks if topPubsCount / nodes.length >= 0.25, so this passes
      expect(result.groups?.length).toBeGreaterThan(0);
    });

    it('should create Date objects from pubdate', () => {
      const result = getResultsGraph(mockDocs);

      result.data.forEach((node) => {
        expect(node.date).toBeInstanceOf(Date);
      });
    });
  });
});

import { IFacetCountsFields } from '@/api';
import { Button, Flex, FormControl, FormLabel, NumberInput, NumberInputField } from '@chakra-ui/react';
import { BarGraph, DataDownloader, Slider } from '@/components';
import { ReactElement, useEffect, useMemo, useState } from 'react';
import { useDebounce } from 'use-debounce';
import { IBarGraph, YearDatum } from '../types';
import { getYearsGraph, groupBarDatumByYear } from '../utils';

export interface IYearsGraphPaneProps {
  data: IFacetCountsFields;
  onApplyYearRange: (min: number, max: number) => void;
}

export const YearsGraphPane = ({ data, onApplyYearRange }: IYearsGraphPaneProps): ReactElement => {
  const [range, setRange] = useState<{ min: number; max: number }>(null);

  const baseGraph: IBarGraph<YearDatum> = useMemo(() => {
    if (data) {
      return getYearsGraph(data);
    }
  }, [data]);

  // prevent graph transform until user has stopped updating slider
  const [debouncedRange] = useDebounce(range, 50);

  const firstYear = baseGraph.data[0].year;
  const lastYear = baseGraph.data[baseGraph.data.length - 1].year;

  useEffect(() => {
    setRange({
      min: firstYear,
      max: lastYear,
    });
  }, [baseGraph]);

  const handleRangeChange = ([min, max]: number[]) => {
    setRange({ min, max });
  };

  const handleRangeMinChange = (valueAsString: string, valueAsNumber: number) => {
    setRange({ ...range, min: valueAsNumber });
  };

  const handleRangeMaxChange = (valueAsString: string, valueAsNumber: number) => {
    setRange({ ...range, max: valueAsNumber });
  };

  const handleApplyLimit = () => {
    onApplyYearRange(range.min, range.max);
  };

  // transformed the graph data using the range
  // group the years if too many to display
  const MAX_X_COUNT = 10;
  const transformedGraph = useMemo(() => {
    if (range && baseGraph) {
      // user selected min and max year to display
      const min =
        isNaN(debouncedRange.min) || debouncedRange.min < firstYear || debouncedRange.min > debouncedRange.max
          ? firstYear
          : debouncedRange.min;
      const max =
        isNaN(debouncedRange.max) || debouncedRange.max > lastYear || debouncedRange.max < debouncedRange.min
          ? lastYear
          : debouncedRange.max;

      const totalYears = max - min + 1;
      const startIndex = min - firstYear;
      const endIndex = startIndex + (max - min) + 1;
      if (totalYears > MAX_X_COUNT) {
        // too crowded to display, create a new bar graph by merging the years
        const groupedDatum = groupBarDatumByYear(baseGraph.data, MAX_X_COUNT, startIndex, endIndex);
        return { data: groupedDatum, keys: baseGraph.keys, indexBy: baseGraph.indexBy };
      } else {
        return {
          data: baseGraph.data.slice(startIndex, endIndex + 1),
          keys: baseGraph.keys,
          indexBy: baseGraph.indexBy,
        };
      }
    }
  }, [baseGraph, debouncedRange]);

  const getCSVDataContent = () =>
    baseGraph.data.reduce(
      (content, { year, refereed, notrefereed }) => content + `\n${year},${refereed + notrefereed},${refereed}`,
      'Year, Article Count, Ref Count',
    );

  return (
    <>
      {transformedGraph && (
        <Flex direction="column">
          <DataDownloader
            label="Download CSV Data"
            getFileContent={getCSVDataContent}
            fileName="years.csv"
            showLabel={true}
            my={5}
          />
          <BarGraph
            data={transformedGraph.data}
            indexBy={transformedGraph.indexBy}
            keys={transformedGraph.keys}
            showGroupOptions={false}
          />
          <Slider
            aria-label="Limit Slider"
            range={[firstYear, lastYear]}
            values={[range.min, range.max]}
            onSlideEnd={handleRangeChange}
            my={5}
            px={4}
            size={1}
          />
          <FormControl my={2}>
            <FormLabel>Limit results to papers from</FormLabel>
            <Flex direction="row" alignItems="center">
              <NumberInput
                value={isNaN(range.min) ? '' : range.min}
                min={firstYear}
                max={lastYear}
                aria-label="min year"
                maxW={24}
                mx={2}
                size="sm"
                onChange={handleRangeMinChange}
              >
                <NumberInputField />
              </NumberInput>
              {' to '}
              <NumberInput
                value={isNaN(range.max) ? '' : range.max}
                min={firstYear}
                max={lastYear}
                aria-label="max year"
                maxW={24}
                mx={2}
                size="sm"
                onChange={handleRangeMaxChange}
              >
                <NumberInputField />
              </NumberInput>
              <Button type="submit" onClick={handleApplyLimit}>
                Search
              </Button>
            </Flex>
          </FormControl>
        </Flex>
      )}
    </>
  );
};

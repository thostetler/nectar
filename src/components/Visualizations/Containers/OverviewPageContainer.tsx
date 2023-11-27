import {
  getSearchFacetCitationsParams,
  getSearchFacetReadsParams,
  getSearchFacetYearsParams,
  IADSApiSearchParams,
  useGetSearchFacet,
  useGetSearchFacetCounts,
} from '@api';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AlertTitle,
  CircularProgress,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react';
import { HIndexGraphPane, YearsGraphPane } from '@components';
import { fqNameYearRange } from '@query';
import { removeFQ, setFQ } from '@query-utils';
import { makeSearchParams } from '@utils';
import axios from 'axios';
import { useRouter } from 'next/router';
import { ReactElement } from 'react';
import { FacetField } from '../types';

interface IOverviewPageContainerProps {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (facet: FacetField, cond: string) => void;
}

export const OverviewPageContainer = ({ query, onApplyQueryCondition }: IOverviewPageContainerProps): ReactElement => {
  const router = useRouter();
  const onApplyYearRange = (min: number, max: number) => {
    // Apply year range fq to query
    const cleanedQuery = query.fq ? removeFQ(fqNameYearRange, query) : query;
    const newQuery = setFQ(fqNameYearRange, `year:${min}-${max}`, cleanedQuery);

    // tigger search
    const search = makeSearchParams({ ...newQuery, p: 1 });
    void router.push({ pathname: '/search', search }, null, { scroll: false });
  };

  const handleApplyCitationCondition = (cond: string) => {
    onApplyQueryCondition('citation_count', cond);
  };

  const handleApplyReadCondition = (cond: string) => {
    onApplyQueryCondition('read_count', cond);
  };

  return (
    <Tabs variant="solid-rounded" isFitted my={10} isLazy={true} lazyBehavior="keepMounted">
      <TabList>
        <Tab>Years</Tab>
        <Tab>Citations</Tab>
        <Tab>Reads</Tab>
      </TabList>
      <TabPanels>
        <TabPanel>
          <YearsTabPane query={query} onApplyYearRange={onApplyYearRange} />
        </TabPanel>
        <TabPanel>
          <CitationTabPane query={query} onApplyQueryCondition={handleApplyCitationCondition} />
        </TabPanel>
        <TabPanel>
          <ReadTabPane query={query} onApplyQueryCondition={handleApplyReadCondition} />
        </TabPanel>
      </TabPanels>
    </Tabs>
  );
};

const YearsTabPane = ({
  query,
  onApplyYearRange,
}: {
  query: IADSApiSearchParams;
  onApplyYearRange: (min: number, max: number) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacetCounts(getSearchFacetYearsParams(query), {
    enabled: !!query && query.q.trim().length > 0,
  });

  return (
    <>
      {isError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(error) && error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && data && <YearsGraphPane data={data} onApplyYearRange={onApplyYearRange} />}
    </>
  );
};

const CitationTabPane = ({
  query,
  onApplyQueryCondition,
}: {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (cond: string) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacet(getSearchFacetCitationsParams(query), {
    enabled: !!query && query.q.trim().length > 0,
  });

  const handleApplyQueryCondition = (cond: string) => {
    onApplyQueryCondition(cond);
  };

  return (
    <>
      {isError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(error) && error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && data && (
        <HIndexGraphPane
          buckets={data?.facets?.citation_count?.buckets}
          sum={data?.stats?.stats_fields?.citation_count?.sum}
          type="citations"
          onApplyCondition={handleApplyQueryCondition}
        />
      )}
    </>
  );
};

const ReadTabPane = ({
  query,
  onApplyQueryCondition,
}: {
  query: IADSApiSearchParams;
  onApplyQueryCondition: (cond: string) => void;
}) => {
  const { data, isLoading, isError, error } = useGetSearchFacet(getSearchFacetReadsParams(query), {
    enabled: !!query && query.q.trim().length > 0,
  });
  const handleApplyQueryCondition = (cond: string) => {
    onApplyQueryCondition(cond);
  };

  return (
    <>
      {isError && (
        <Alert status="error" my={5}>
          <AlertIcon />
          <AlertTitle mr={2}>Error fetching data!</AlertTitle>
          <AlertDescription>{axios.isAxiosError(error) && error.message}</AlertDescription>
        </Alert>
      )}
      {isLoading && <CircularProgress isIndeterminate />}
      {!isLoading && data && (
        <HIndexGraphPane
          buckets={data?.facets?.read_count?.buckets}
          sum={data?.stats?.stats_fields?.read_count?.sum}
          type="reads"
          onApplyCondition={handleApplyQueryCondition}
        />
      )}
    </>
  );
};

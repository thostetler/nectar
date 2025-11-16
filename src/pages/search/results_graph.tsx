import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { VizPageLayout } from '@/components/Layout';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import dynamic from 'next/dynamic';

// Lazy load heavy visualization component
const ResultsGraphPageContainer = dynamic(
  () => import('@/components/Visualizations').then((m) => ({ default: m.ResultsGraphPageContainer })),
  { ssr: false },
);

const ResultsGraphPage: NextPage = () => {
  const router = useRouter();

  // get original query q, used to 'navigate back' to the original search
  const { qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.asPath);

  // get the new query q that will be used to fetch author network
  // this could be the qid or the modified original query
  const { p, ...query } = originalQuery;
  const newQuery = qid ? { ...query, q: `docs(${qid})` } : query;

  return (
    <div>
      <VizPageLayout vizPage="results_graph" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
        <ResultsGraphPageContainer query={newQuery} />
      </VizPageLayout>
    </div>
  );
};

export default ResultsGraphPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

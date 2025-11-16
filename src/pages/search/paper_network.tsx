import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { VizPageLayout } from '@/components/Layout';
import { makeSearchParams, parseQueryFromUrl } from '@/utils/common/search';
import dynamic from 'next/dynamic';

// Lazy load heavy visualization component
const PaperNetworkPageContainer = dynamic(
  () => import('@/components/Visualizations').then((m) => ({ default: m.PaperNetworkPageContainer })),
  { ssr: false },
);

const PaperMetworkPage: NextPage = () => {
  const router = useRouter();

  // get original query q, used to 'navigate back' to the original search
  const { qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.asPath);

  // get the new query q that will be used to fetch paper network
  // this could be the qid or the modified original query
  const { p, ...query } = originalQuery;
  const newQuery = qid ? { ...query, q: `docs(${qid})` } : query;

  return (
    <div>
      <VizPageLayout vizPage="paper_network" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
        <PaperNetworkPageContainer query={newQuery} />
      </VizPageLayout>
    </div>
  );
};

export default PaperMetworkPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

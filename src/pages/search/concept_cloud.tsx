import { NextPage } from 'next';
import { useRouter } from 'next/router';
import { VizPageLayout } from '@/components/Layout';
import { parseQueryFromUrl } from '@/utils/common/search';
import dynamic from 'next/dynamic';

// Lazy load heavy visualization component
const ConceptCloudPageContainer = dynamic(
  () => import('@/components/Visualizations').then((m) => ({ default: m.ConceptCloudPageContainer })),
  { ssr: false },
);

const ConceptCloudPage: NextPage = () => {
  const router = useRouter();

  // get original query q, used to 'navigate back' to the original search
  const { qid, ...originalQuery } = parseQueryFromUrl<{ qid: string }>(router.asPath);

  // get the new query q that will be used to fetch word cloud
  // this could be the qid or the modified original query
  const { p, ...query } = originalQuery;
  const newQuery = qid ? { ...query, q: `docs(${qid})` } : query;

  return (
    <div>
      <VizPageLayout vizPage="concept_cloud" from={{ pathname: '/search', query: { ...query, p } }}>
        <ConceptCloudPageContainer query={newQuery} />
      </VizPageLayout>
    </div>
  );
};

export default ConceptCloudPage;
export { injectSessionGSSP as getServerSideProps } from '@/ssr-utils';

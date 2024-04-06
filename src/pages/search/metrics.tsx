import { MetricsPageContainer, VizPageLayout } from '@/components';
import { makeSearchParams, parseQueryFromUrl } from '@/utils';
import { NextPage } from 'next';
import { IADSApiSearchParams } from '@/api/search';
import { useRouter } from 'next/router';

const BATCH_SIZE = 1000;

const MetricsPage: NextPage = () => {
  const router = useRouter();
  const { qid: _, ...originalQuery } = router.query;
  const { qid = null, p, ...query } = parseQueryFromUrl<{ qid: string }>(router.asPath, { sortPostfix: 'id asc' });
  const bibsQuery: IADSApiSearchParams = {
    rows: BATCH_SIZE,
    fl: ['bibcode'],
    ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
  };

  return (
    <VizPageLayout vizPage="metrics" from={{ pathname: '/search', query: makeSearchParams(originalQuery) }}>
      <MetricsPageContainer query={bibsQuery} />
    </VizPageLayout>
  );
};

// export const getServerSideProps: GetServerSideProps = composeNextGSSP(async (ctx) => {
//   const { qid: _qid, ...originalQuery } = ctx.query;
//   const { qid = null, p, ...query } = parseQueryFromUrl<{ qid: string }>(ctx.req.url, { sortPostfix: 'id asc' });
//
//   // TODO: figure out why this clears the cache on transition
//   // const queryClient = new QueryClient();
//
//   try {
//     // prefetch bibcodes from query
//
//     const params: IADSApiSearchParams = {
//       rows: BATCH_SIZE,
//       fl: ['bibcode'],
//       ...(qid ? { q: `docs(${qid})`, sort: ['id asc'] } : query),
//     };
//
//     // await queryClient.prefetchInfiniteQuery({
//     //   queryKey: searchKeys.infinite(params),
//     //   queryFn: fetchSearchInfinite,
//     //   meta: { params },
//     // });
//
//     // react-query infinite queries cannot be serialized by next, currently.
//     // see https://github.com/tannerlinsley/react-query/issues/3301#issuecomment-1041374043
//     // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
//     // const dehydratedState: DehydratedState = JSON.parse(JSON.stringify(dehydrate(queryClient)));
//
//     return Promise.resolve({
//       props: {
//         originalQuery,
//         bibsQuery: params,
//       },
//     });
//   } catch (error) {
//     logger.error({ msg: 'GSSP error on metrics page', error });
//     return Promise.resolve({
//       props: {
//         error: parseAPIError(error, { defaultMessage: 'Unable to fetch data' }),
//         pageError: parseAPIError(error),
//       },
//     });
//   }
// });

export default MetricsPage;

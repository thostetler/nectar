import { dehydrate, DehydratedState, QueryClient } from '@tanstack/react-query';
import {
  fetchSearch,
  getAbstractParams,
  getCitationsParams,
  getCoreadsParams,
  getReferencesParams,
  getSimilarParams,
  getTocParams,
  searchKeys,
} from '@/api/search';
import { logger } from '@/logger';
import { parseAPIError } from '@/utils';
import { GetServerSideProps } from 'next/types';
import { fetchGraphics, graphicsKeys } from '@/api/graphics';
import { fetchMetrics, getMetricsParams, metricsKeys } from '@/api/metrics';
import { fetchLinks, resolverKeys } from '@/api/resolver';

export const getDetailsPageGSSP = (async (context) => {
  context.res.setHeader(
    'Cache-Control',
    'public, max-age=900, stale-while-revalidate=3600'
  );

  const { id } = context.params;
  const queryClient = new QueryClient();

  try {
    const token = '';
    const pathname = context.resolvedUrl.split('?')[0];

    const res = await queryClient.fetchQuery({
      queryKey: searchKeys.abstract(id),
      queryFn: (_) => fetchSearch(_, { token, req: context.req }),
      meta: { params: getAbstractParams(id) },
    });
    logger.debug({ msg: 'Abstract fetch response', res });

    if (res) {
      if (res.response.numFound === 0) {
        return {
          notFound: true,
        };
      }

      return {
        props: {
          dehydratedState: dehydrate(queryClient),
          ssr: {
            hasError: false,
          },
        },
      };
    }

    await Promise.allSettled([
      // primary abstract data
      queryClient.fetchQuery({
        queryKey: searchKeys.abstract(id),
        queryFn: (_) => fetchSearch(_, { token, req: context.req }),
        meta: { params: getAbstractParams(id) },
      }),

      // graphics
      queryClient.prefetchQuery({
        queryKey: graphicsKeys.primary(id),
        queryFn: (_) => fetchGraphics(_, { token, req: context.req }),
        meta: { params: { bibcode: id } },
      }),

      // metrics
      queryClient.prefetchQuery({
        queryKey: metricsKeys.primary([id]),
        queryFn: (_) => fetchMetrics(_, { token, req: context.req }),
        meta: { params: getMetricsParams([id]) },
      }),

      // associated works
      queryClient.prefetchQuery({
        queryKey: resolverKeys.links({ bibcode: id, link_type: 'associated' }),
        queryFn: (_) => fetchLinks(_, { token, req: context.req }),
        meta: { params: { bibcode: id, link_type: 'associated' } },
      }),

      // references (only if we're on the references page)
      pathname.endsWith('/references')
        ? queryClient.prefetchQuery({
          queryKey: searchKeys.references({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, req: context.req }),
          meta: { params: getReferencesParams(id, 0) },
        })
        : Promise.resolve(),

      // citations (only if we're on the citations page)
      pathname.endsWith('/citations')
        ? queryClient.prefetchQuery({
          queryKey: searchKeys.citations({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, req: context.req }),
          meta: { params: getCitationsParams(id, 0) },
        })
        : Promise.resolve(),

      // coreads (only if we're on the coreads page)
      pathname.endsWith('/coreads')
        ? queryClient.prefetchQuery({
          queryKey: searchKeys.coreads({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, req: context.req }),
          meta: { params: getCoreadsParams(id, 0) },
        })
        : Promise.resolve(),

      // similar (only if we're on the similar page)
      pathname.endsWith('/similar')
        ? queryClient.prefetchQuery({
          queryKey: searchKeys.similar({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, req: context.req }),
          meta: { params: getSimilarParams(id, 0) },
        })
        : Promise.resolve(),

      // toc (only if we're on the toc page)
      pathname.endsWith('/toc')
        ? queryClient.prefetchQuery({
          queryKey: searchKeys.toc({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, req: context.req }),
          meta: { params: getTocParams(id, 0) },
        })
        : Promise.resolve(),
    ]);













  } catch (error) {
    logger.error({ msg: 'Failed to fetch abstract', error });
    return Promise.resolve({
      props: {
        ssr: {
          hasError: true,
          error: parseAPIError(error),
        },
      },
    });
  }
}) satisfies GetServerSideProps<{ ssr: { hasError: boolean; error?: string}, dehydratedState?: DehydratedState }, { id: string }>;

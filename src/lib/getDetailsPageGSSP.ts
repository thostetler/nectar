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
import { getIronSession } from 'iron-session/edge';
import { getSessionConfig } from '@/config';
import { isEmpty } from 'ramda';
import axios from 'axios';

export const getDetailsPageGSSP = (async (ctx) => {
  let session = await getIronSession(ctx.req, ctx.res, getSessionConfig());
  const headers = ctx.req.headers;
  const token = session.auth.apiToken;

  if (isEmpty(session)) {
    try {
      await axios.post('/api/auth/session', null, { headers });
      session = await getIronSession(ctx.req, ctx.res, getSessionConfig());
    } catch (error) {
      logger.error({ msg: 'Failed to bootstrap user', error });
      return {
        props: {
          ssr: {
            hasError: true,
            error: 'NoSession',
          },
        },
      };
    }
  }

  ctx.res.setHeader(
    'Cache-Control',
    'max-age=3600, stale-while-revaluate=86400',
  );

  const { id } = ctx.params;
  const queryClient = new QueryClient();

  try {
    const pathname = ctx.resolvedUrl.split('?')[0];

    switch (true) {
      case pathname.endsWith('/abstract'):
        await queryClient.fetchQuery({
          queryKey: searchKeys.abstract(id),
          queryFn: (_) => fetchSearch(_, { token, headers }),
          meta: { params: getAbstractParams(id) },
        });

        await queryClient.prefetchQuery({
          queryKey: resolverKeys.links({ bibcode: id, link_type: 'associated' }),
          queryFn: (_) => fetchLinks(_, { token, headers }),
          meta: { params: { bibcode: id, link_type: 'associated' } },
        });
        break;

      case pathname.endsWith('/graphics'):
        await queryClient.prefetchQuery({
          queryKey: graphicsKeys.primary(id),
          queryFn: (_) => fetchGraphics(_, { token, headers }),
          meta: { params: { bibcode: id } },
        });
        break;

      case pathname.endsWith('/metrics'):
        await queryClient.prefetchQuery({
          queryKey: metricsKeys.primary([id]),
          queryFn: (_) => fetchMetrics(_, { token, headers }),
          meta: { params: getMetricsParams([id]) },
        });
        break;

      case pathname.endsWith('/references'):
        await queryClient.prefetchQuery({
          queryKey: searchKeys.references({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, headers }),
          meta: { params: getReferencesParams(id, 0) },
        });
        break;

      case pathname.endsWith('/citations'):
        await queryClient.prefetchQuery({
          queryKey: searchKeys.citations({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, headers }),
          meta: { params: getCitationsParams(id, 0) },
        });
        break;

      case pathname.endsWith('/coreads'):
        await queryClient.prefetchQuery({
          queryKey: searchKeys.coreads({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, headers }),
          meta: { params: getCoreadsParams(id, 0) },
        });
        break;

      case pathname.endsWith('/similar'):
        await queryClient.prefetchQuery({
          queryKey: searchKeys.similar({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, headers }),
          meta: { params: getSimilarParams(id, 0) },
        });
        break;

      case pathname.endsWith('/toc'):
        await queryClient.prefetchQuery({
          queryKey: searchKeys.toc({ bibcode: id, start: 0 }),
          queryFn: (_) => fetchSearch(_, { token, headers }),
          meta: { params: getTocParams(id, 0) },
        });
        break;
    }

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        ssr: {
          hasError: false,
        },
      },
    };

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
}) satisfies GetServerSideProps<{ ssr: { hasError: boolean; error?: string }, dehydratedState?: DehydratedState }, {
  id: string
}>;

import { GetServerSideProps } from 'next';
import { sessionConfig, TRACING_HEADERS } from '@/config';
import { logger } from '@/logger';
import axios from 'axios';
import { IBootstrapPayload } from '@/api/user';
import { ApiTargets } from '@/api/models';
import { omit, pick } from 'ramda';
import { dehydrate, QueryClient } from '@tanstack/react-query';
import { parseAPIError, parseQueryFromUrl } from '@/utils';
import { getSearchParams, IADSApiSearchResponse, searchKeys } from '@/api/search';
import { NumPerPageType } from '@/types';
import { AppState } from '@/store/types';
import { getIronSession } from 'iron-session';
import { IncomingMessage } from 'http';
import qs from 'qs';
import { isUserData } from '@/api/api';

export const parseSearchUrlToParams = (url: string) => {
  const { p: page, n: numPerPage, ...query } = parseQueryFromUrl<{ p: string; n: string }>(url);

  const params = getSearchParams({
    ...omitUnsafeQueryParams(query),
    q: query.q.length === 0 ? '*:*' : query.q,
    start: (page - 1) * numPerPage,
    rows: numPerPage,
  });

  return { params, page, numPerPage };
}

const omitUnsafeQueryParams = omit(['fl', 'start', 'rows']);
const log = logger.child({ module: 'gssp/search' }, { msgPrefix: '[gssp:search] ' });

const getHeaders = (req: IncomingMessage) => {
  const headers: Record<string, string | string[]> = {};
  TRACING_HEADERS.forEach((key) => {
    if (req.headers[key]) {
      headers[key] = req.headers[key];
    }
  })
  return headers;
}

export const searchGSSP: GetServerSideProps = async (ctx) => {
  ctx.res.setHeader('Cache-Control', 's-max-age=60, stale-while-revalidate=300');
  const session = await getIronSession(ctx.req, ctx.res, sessionConfig);
  log.debug({ query: ctx.query }, 'Processing request in GSSP');

  // check session for token information
  let token = session?.token?.access_token;
  if (!token) {
    log.debug('Token not found on session, bootstrapping...')
    try {
      const adsCookie = ctx.req.cookies[process.env.ADS_SESSION_COOKIE_NAME];
      log.debug('Bootstrapping token');

      const { data, headers } = await axios.request<IBootstrapPayload>({
        method: 'GET',
        baseURL: process.env.API_HOST_SERVER,
        timeout: 30_000,
        url: ApiTargets.BOOTSTRAP,
        headers: {
          ...getHeaders(ctx.req),
          ...(typeof adsCookie === 'string' ? { Cookie: `${process.env.ADS_SESSION_COOKIE_NAME}=${adsCookie}` } : {})
        },
      });

      log.debug({ data }, 'Bootstrap Successful');

      // forward the set-cookie
      ctx.res.setHeader('set-cookie', headers['set-cookie']);

      // apply token to the session
      session.token = pick<keyof IBootstrapPayload>(['access_token', 'expire_in', 'anonymous', 'username'])(data);
      session.isAuthenticated = !data.anonymous;
      await session.save();

      token = data.access_token;
    } catch (e) {
      log.error({ err: e }, 'Bootstrapping failed');
      return {
        props: {
          pageError: 'Failed to authenticate with api.'
        }
      }
    }
  } else {
    log.debug({ token }, 'Token found in session, doing search')
  }

  const queryClient = new QueryClient();
  const { params, page, numPerPage } = parseSearchUrlToParams(ctx.req.url);

  try {
    const queryKey = searchKeys.primary(params);
    log.debug({ params }, 'Fetching search results')

    // primary query prefetch
    await queryClient.fetchQuery({
      queryKey,
      queryFn: async () => {

        const { data } = await axios.request<IADSApiSearchResponse>({
          method: 'GET',
          baseURL: process.env.API_HOST_SERVER,
          url: ApiTargets.SEARCH,
          timeout: 30_000,
          withCredentials: true,
          paramsSerializer: {
            serialize: (params) =>
              qs.stringify(params, {
                indices: false,
                arrayFormat: 'repeat',
                format: 'RFC1738',
                sort: (a, b) => a - b,
                skipNulls: true,
              }),
          },
          params,
          headers: {
            ...getHeaders(ctx.req),
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        });

        return data;
      }
    });

    log.debug('Search successful');

    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        dehydratedAppState: {
          query: params,
          latestQuery: params,
          numPerPage: numPerPage as NumPerPageType,
          user: isUserData(session.token) ? session.token : {},
        } as AppState,
        page,
        params,
      },
    };
  } catch (error) {
    logger.error({ err: error, apiError: parseAPIError(error) }, 'Failed to fetch search results');
    return {
      props: {
        dehydratedState: dehydrate(queryClient),
        dehydratedAppState: {
          query: params,
          latestQuery: params,
          numPerPage: numPerPage as NumPerPageType,
          user: isUserData(session.token) ? session.token : {},
        } as AppState,
        page,
        pageError: parseAPIError(error),
        params,
      },
    };
  }
}

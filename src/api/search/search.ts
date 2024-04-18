import axios, { AxiosError } from 'axios';
import { omit } from 'ramda';
import { MutationFunction, useInfiniteQuery, useMutation, useQuery } from '@tanstack/react-query';
import {
  defaultParams,
  getAbstractParams,
  getAffiliationParams,
  getBigQueryParams,
  getCitationsParams,
  getCoreadsParams,
  getHighlightParams,
  getReferencesParams,
  getSearchFacetJSONParams,
  getSearchFacetParams,
  getSearchParams,
  getSimilarParams,
  getSingleRecordParams,
  getTocParams,
} from './models';
import { isString } from '@/utils';
import { resolveObjectQuery } from '@/api/objects/objects';
import { IADSApiSearchParams, IADSApiSearchResponse, IBigQueryMutationParams, IDocsEntity } from './types';
import { ADSMutation, ADSQuery, InfiniteADSQuery, QueryFunctionSsr } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

type ErrorType = Error | AxiosError;

type SearchADSQuery<P = IADSApiSearchParams, R = IADSApiSearchResponse['response']> = ADSQuery<
  P,
  IADSApiSearchResponse,
  R
>;

export const responseSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['response'] => data.response;
export const facetCountSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['facet_counts'] =>
  data.facet_counts;
export const highlightingSelector = (
  data: IADSApiSearchResponse,
): { docs: IADSApiSearchResponse['response']['docs']; highlighting: IADSApiSearchResponse['highlighting'] } => ({
  docs: data.response.docs,
  highlighting: data.highlighting,
});
export const facetFieldSelector = (data: IADSApiSearchResponse): IADSApiSearchResponse['facets'] => data.facets;

type SearchKeyProps =
  | { bibcode: IDocsEntity['bibcode']; start?: number }
  | { bibcode: IDocsEntity['bibcode']; start: number };

export enum SEARCH_API_KEYS {
  primary = 'search/primary',
  preview = 'search/preview',
  infinite = 'search/infinite',
  highlight = 'search/highlight',
  bigquery = 'search/bigquery',
}

export const searchKeys = {
  primary: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.primary, params] as const,
  highlight: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.highlight, params] as const,
  preview: (bibcode: IDocsEntity['bibcode']) => ['search/preview', { bibcode }] as const,
  abstract: (id: string) => ['search/abstract', { id }] as const,
  affiliations: ({ bibcode }: SearchKeyProps) => ['search/affiliations', { bibcode }] as const,
  citations: ({ bibcode, start }: SearchKeyProps) => ['search/citations', { bibcode, start }] as const,
  references: ({ bibcode, start }: SearchKeyProps) => ['search/references', { bibcode, start }] as const,
  coreads: ({ bibcode, start }: SearchKeyProps) => ['search/coreads', { bibcode, start }] as const,
  similar: ({ bibcode, start }: SearchKeyProps) => ['search/similar', { bibcode, start }] as const,
  toc: ({ bibcode, start }: SearchKeyProps) => ['search/toc', { bibcode, start }] as const,
  stats: (params: IADSApiSearchParams) => ['search/stats', params] as const,
  facet: (params: IADSApiSearchParams) => ['search/facet', params] as const,
  infinite: (params: IADSApiSearchParams) => [SEARCH_API_KEYS.infinite, params] as const,
  record: (id: string) => ['search/record', { id }] as const,
  bigquery: () => [SEARCH_API_KEYS.bigquery] as const,
};

// default params to omit to keep cache entries more concise
const omitParams = (query: IADSApiSearchParams) =>
  omit<IADSApiSearchParams, string>(['fl', 'p'], query) as IADSApiSearchParams;

/**
 * Generic search hook
 */
export const useSearch: SearchADSQuery = (params, options) => {
  // omit fields from queryKey
  const cleanParams = omitParams(getSearchParams(params));

  return useQuery<IADSApiSearchResponse, ErrorType, IADSApiSearchResponse['response']>({
    queryKey: searchKeys.primary(cleanParams),
    queryHash: JSON.stringify(searchKeys.primary(cleanParams)),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    retry: (failCount, error): boolean => {
      return axios.isAxiosError(error) && error.response?.status !== 400;
    },
    ...options,
  });
};

export const useCitationStats: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['stats']> = (
  params,
  options,
) => {
  // omit fields from queryKey
  const cleanParams = omitParams(getSearchParams(params));

  // stats are added to the query depending on sort type, so we can just use the primary
  return useQuery({
    queryKey: searchKeys.primary(cleanParams),
    queryHash: JSON.stringify(searchKeys.primary(cleanParams)),
    queryFn: fetchSearch,
    meta: { params },
    select: (data) => data.stats,
    retry: (failCount, error): boolean => {
      return axios.isAxiosError(error) && error.response?.status !== 400;
    },
    ...options,
  });
};

type SubPageQuery = SearchADSQuery<{ bibcode: IDocsEntity['bibcode']; start?: IADSApiSearchParams['start'] }>;

/**
 * Get highlights based on a search query
 */
export const useGetHighlights: SearchADSQuery<
  IADSApiSearchParams,
  { docs: IADSApiSearchResponse['response']['docs']; highlighting: IADSApiSearchResponse['highlighting'] }
> = (params, options) => {
  const highlightParams = getHighlightParams(params);
  return useQuery({
    queryKey: searchKeys.highlight(omitParams(highlightParams)),
    queryFn: fetchSearch,
    meta: { params: highlightParams },
    select: highlightingSelector,
    ...options,
  });
};

/**
 * Get citations based on a bibcode and start
 */
export const useGetCitations: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getCitationsParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.citations({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get references based on a bibcode and start
 */
export const useGetReferences: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getReferencesParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.references({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get coreads based on a bibcode and start
 */
export const useGetCoreads: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getCoreadsParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.coreads({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get similar docs based on a bibcode and start
 */
export const useGetSimilar: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getSimilarParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.similar({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get TOC docs based on a bibcode and start
 */
export const useGetToc: SubPageQuery = ({ bibcode, start = 0 }, options) => {
  const params = getTocParams(bibcode, start);
  return useQuery({
    queryKey: searchKeys.toc({ bibcode, start }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get abstract based on an id
 */
export const useGetAbstract: SearchADSQuery<{ id: string }> = ({ id }, options) => {
  const params = getAbstractParams(id);
  return useQuery({
    queryKey: searchKeys.abstract(id),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get affiliations based on an id
 */
export const useGetAffiliations: SearchADSQuery<{ bibcode: IDocsEntity['bibcode'] }> = ({ bibcode }, options) => {
  const params = getAffiliationParams(bibcode);
  return useQuery({
    queryKey: searchKeys.affiliations({ bibcode }),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get abstract preview based on bibcode
 */
export const useGetAbstractPreview: SearchADSQuery<{ bibcode: IDocsEntity['bibcode'] }> = ({ bibcode }, options) => {
  const params = { ...defaultParams, q: `identifier:"${bibcode}"`, fl: ['abstract'] };
  return useQuery({
    queryKey: searchKeys.preview(bibcode),
    queryHash: JSON.stringify(searchKeys.preview(bibcode)),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

/**
 * Get a single record using identifier for feedack form
 */
export const useGetSingleRecord: SearchADSQuery<{ id: string }> = ({ id }, options) => {
  const params = getSingleRecordParams(id);
  return useQuery({
    queryKey: searchKeys.record(id),
    queryFn: fetchSearch,
    meta: { params },
    select: responseSelector,
    ...options,
  });
};

export const useGetSearchFacetCounts: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['facet_counts']> = (
  params,
  options,
) => {
  const searchParams: IADSApiSearchParams = getSearchFacetParams(params);

  // omit fields from queryKey
  const cleanParams = omitParams(searchParams);

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    queryHash: JSON.stringify(cleanParams),
    meta: { params: searchParams },
    select: facetCountSelector,
    ...options,
  });
};

export const useGetSearchFacet: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse> = (params, options) => {
  const searchParams: IADSApiSearchParams = getSearchFacetParams(params);

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    meta: { params: searchParams },
    ...options,
  });
};

export const useGetSearchFacetJSON: SearchADSQuery<IADSApiSearchParams, IADSApiSearchResponse['facets']> = (
  params,
  options,
) => {
  const searchParams: IADSApiSearchParams = getSearchFacetJSONParams(params);

  // omit fields from queryKey
  const { fl, ...cleanParams } = searchParams;

  return useQuery({
    queryKey: searchKeys.facet(cleanParams),
    queryFn: fetchSearch,
    meta: { params: searchParams },
    select: facetFieldSelector,
    ...options,
  });
};

export const useSearchInfinite: InfiniteADSQuery<IADSApiSearchParams, IADSApiSearchResponse> = (params, options) => {
  return useInfiniteQuery({
    queryKey: searchKeys.infinite(params),
    initialPageParam: '*',
    queryFn: ({ pageParam }) => fetchSearchInfinite(params, pageParam),
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
      // check if cursormark is same as we sent and that we didn't receive all of them in the first request
      return lastPage.response.numFound > params.rows && lastPage.nextCursorMark !== lastPageParam
        ? lastPage.nextCursorMark
        : null;
    },
    ...options,
  });
};

export const useBigQuerySearch: ADSMutation<
  IADSApiSearchResponse['response'],
  IADSApiSearchParams,
  IBigQueryMutationParams['variables']
> = (options) => {
  const params = getBigQueryParams();
  return useMutation({
    mutationKey: searchKeys.bigquery(),
    mutationFn: ({ bibcodes, rows, sort }) =>
      fetchBigQuerySearch({ params, variables: { bibcodes, rows, sort: sort ?? ['date desc'] } }),
    ...options,
  });
};

export const fetchBigQuerySearch: MutationFunction<IADSApiSearchResponse['response'], IBigQueryMutationParams> =
  async ({ params, variables }: IBigQueryMutationParams) => {
    const config: ApiRequestConfig = {
      method: 'POST',
      url: `${ApiTargets.BIGQUERY}`,
      params: { ...params, rows: variables.rows, sort: variables.sort },
      data: `bibcode\n${variables.bibcodes.join('\n')}`,
      headers: { 'Content-Type': 'bigquery/csv' },
    };

    const { data } = await api.request<IADSApiSearchResponse>(config);
    return data.response;
  };

/**
 * Base fetcher for search
 *
 * *This shouldn't be used directly, except during prefetching*
 */
export const fetchSearch: QueryFunctionSsr<IADSApiSearchResponse> = async ({ meta }, options) => {
  const { params } = meta as { params: IADSApiSearchParams };

  const finalParams = { ...params };
  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuery({ query: params.q });
    finalParams.q = query;
  }

  // If the sort is by citation count, then add stats field
  if (/^citation_count(_norm)?/.test(params.sort[0])) {
    finalParams.stats = true;
    finalParams['stats.field'] = params.sort[0].replace(/\s(asc|desc)$/, '');
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: finalParams,
  };

  if (typeof window === 'undefined' && options?.token && options?.token.length > 0) {
    const { data } = await api.ssrRequest<IADSApiSearchResponse>(config, options);
    return data;
  }
  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};

export const fetchSearchInfinite = async (params: IADSApiSearchParams, pageParam: string) => {
  const finalParams = { ...params };
  if (isString(params.q) && params.q.includes('object:')) {
    const { query } = await resolveObjectQuery({ query: params.q });
    finalParams.q = query;
  }

  // If the sort is by citation count, then add stats field
  if (/^citation_count(_norm)?/.test(params.sort[0])) {
    finalParams.stats = true;
    finalParams['stats.field'] = params.sort[0].replace(/\s(asc|desc)$/, '');
  }

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params: {
      ...finalParams,
      cursorMark: pageParam,
    } as IADSApiSearchParams,
  };
  const { data } = await api.request<IADSApiSearchResponse>(config);

  return data;
};

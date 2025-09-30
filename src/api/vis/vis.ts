import { ApiTargets } from '@/api/models';
import {
  IADSApiAuthorNetworkResponse,
  IADSApiPaperNetworkResponse,
  IADSApiVisParams,
  IADSApiWordCloudParams,
  IADSApiWordCloudResponse,
} from './types';
import { QueryFunction, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { getAuthorNetworkParams, getPaperNetworkParams, getResultsGraphParams, getWordCloudParams } from './models';
import { ADSQuery } from '@/api/types';
import { IADSApiSearchParams, IADSApiSearchResponse } from '@/api/search/types';
import api, { ApiRequestConfig } from '@/api/api';
import { UI_TAGS, UiTag } from '@/sentry/uiTags';
import { AxiosError } from 'axios';

const MAX_RETRIES = 3;

export const visKeys = {
  authorNetwork: (params: IADSApiVisParams) => ['vis/authorNetwork', { ...params }] as const,
  paperNetwork: (params: IADSApiVisParams) => ['vis/paperNetwork', { ...params }] as const,
  wordCloud: (params: IADSApiWordCloudParams) => ['vis/wordCloud', { ...params }] as const,
  resultsGraph: (params: IADSApiSearchParams) => ['vis/resultsGraph', params] as const,
};

const retryFn = (count: number) => {
  if (count >= MAX_RETRIES) {
    return false;
  }

  return true;
};

type VisMeta<TParams> = {
  params: TParams;
  uiTag?: UiTag;
};

const mergeMeta = (meta: unknown, extras: Record<string, unknown>): Record<string, unknown> => ({
  ...(typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {}),
  ...extras,
});

export const useGetAuthorNetwork: ADSQuery<IADSApiSearchParams, IADSApiAuthorNetworkResponse> = (params, options) => {
  const authorNetworkParams = getAuthorNetworkParams(params);

  const mergedMeta = mergeMeta(options?.meta, {
    params: authorNetworkParams,
    uiTag: UI_TAGS.RESULTS_NETWORK_AUTHOR,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IADSApiAuthorNetworkResponse,
    Error | AxiosError,
    IADSApiAuthorNetworkResponse,
    ReturnType<typeof visKeys.authorNetwork>
  >;

  return useQuery({
    queryKey: visKeys.authorNetwork(authorNetworkParams),
    queryFn: fetchAuthorNetwork,
    retry: retryFn,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchAuthorNetwork: QueryFunction<IADSApiAuthorNetworkResponse> = async ({ meta }) => {
  const { params, uiTag } = meta as VisMeta<IADSApiVisParams>;

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_AUTHOR_NETWORK,
    data: params,
    uiTag: uiTag ?? UI_TAGS.RESULTS_NETWORK_AUTHOR,
  };

  const { data } = await api.request<IADSApiAuthorNetworkResponse>(config);
  return data;
};

export const useGetPaperNetwork: ADSQuery<IADSApiSearchParams, IADSApiPaperNetworkResponse> = (params, options) => {
  const paperNetworkParams = getPaperNetworkParams(params);

  const mergedMeta = mergeMeta(options?.meta, {
    params: paperNetworkParams,
    uiTag: UI_TAGS.RESULTS_NETWORK_PAPER,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IADSApiPaperNetworkResponse,
    Error | AxiosError,
    IADSApiPaperNetworkResponse,
    ReturnType<typeof visKeys.paperNetwork>
  >;

  return useQuery({
    queryKey: visKeys.paperNetwork(paperNetworkParams),
    queryFn: fetchPaperNetwork,
    retry: retryFn,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchPaperNetwork: QueryFunction<IADSApiPaperNetworkResponse> = async ({ meta }) => {
  const { params, uiTag } = meta as VisMeta<IADSApiVisParams>;

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_PAPER_NETWORK,
    data: params,
    uiTag: uiTag ?? UI_TAGS.RESULTS_NETWORK_PAPER,
  };

  const { data } = await api.request<IADSApiPaperNetworkResponse>(config);
  return data;
};

export const useGetWordCloud: ADSQuery<IADSApiSearchParams, IADSApiWordCloudResponse> = (params, options) => {
  const wordCloudParams = getWordCloudParams(params);

  const mergedMeta = mergeMeta(options?.meta, {
    params: wordCloudParams,
    uiTag: UI_TAGS.RESULTS_WORDCLOUD,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IADSApiWordCloudResponse,
    Error | AxiosError,
    IADSApiWordCloudResponse,
    ReturnType<typeof visKeys.wordCloud>
  >;

  return useQuery({
    queryKey: visKeys.wordCloud(wordCloudParams),
    queryFn: fetchWordCloud,
    retry: retryFn,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchWordCloud: QueryFunction<IADSApiWordCloudResponse> = async ({ meta }) => {
  const { params, uiTag } = meta as VisMeta<IADSApiWordCloudParams>;

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_WORDCLOUD,
    data: params,
    uiTag: uiTag ?? UI_TAGS.RESULTS_WORDCLOUD,
  };

  const { data } = await api.request<IADSApiWordCloudResponse>(config);
  return data;
};

export const useGetResultsGraph: ADSQuery<IADSApiSearchParams, IADSApiSearchResponse> = (params, options) => {
  const resultsGraphParams = getResultsGraphParams(params);

  const mergedMeta = mergeMeta(options?.meta, {
    params: resultsGraphParams,
    uiTag: UI_TAGS.RESULTS_BUBBLE_CHART,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IADSApiSearchResponse,
    Error | AxiosError,
    IADSApiSearchResponse,
    ReturnType<typeof visKeys.resultsGraph>
  >;

  return useQuery({
    queryKey: visKeys.resultsGraph(resultsGraphParams),
    queryFn: fetchResultsGraph,
    retry: retryFn,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchResultsGraph: QueryFunction<IADSApiSearchResponse> = async ({ meta }) => {
  const { params, uiTag } = meta as VisMeta<IADSApiSearchParams>;

  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.SEARCH,
    params,
    uiTag: uiTag ?? UI_TAGS.RESULTS_BUBBLE_CHART,
  };

  const { data } = await api.request<IADSApiSearchResponse>(config);
  return data;
};

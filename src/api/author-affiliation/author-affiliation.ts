import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';
import { ADSQuery } from '@/api/types';
import { QueryFunction, UseQueryOptions, useQuery } from '@tanstack/react-query';
import { getAuthorAffiliationSearchParams } from './model';
import { IAuthorAffiliationExportPayload, IAuthorAffiliationPayload, IAuthorAffiliationResponse } from './types';
import { UI_TAGS, UiTag } from '@/sentry/uiTags';
import type { AxiosError } from 'axios';

export const authorAffiliationsKeys = {
  search: (params: IAuthorAffiliationPayload) => ['authoraffiliation/search', params] as const,
  export: (params: IAuthorAffiliationExportPayload) => ['authoraffiliation/export', params] as const,
};

type SearchQuery = ADSQuery<
  Parameters<(typeof authorAffiliationsKeys)['search']>[0],
  IAuthorAffiliationResponse['data']
>;
type ExportQuery = ADSQuery<Parameters<(typeof authorAffiliationsKeys)['export']>[0], string>;

const mergeMeta = (meta: unknown, extras: Record<string, unknown>): Record<string, unknown> => ({
  ...(typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {}),
  ...extras,
});

export const useAuthorAffiliationSearch: SearchQuery = (params, options) => {
  const searchParams = getAuthorAffiliationSearchParams(params);
  const mergedMeta = mergeMeta(options?.meta, {
    params: searchParams,
    uiTag: UI_TAGS.RESULTS_AUTHOR_AFF_SEARCH,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IAuthorAffiliationResponse['data'],
    Error | AxiosError,
    IAuthorAffiliationResponse['data'],
    ReturnType<typeof authorAffiliationsKeys.search>
  >;

  return useQuery({
    queryKey: authorAffiliationsKeys.search(searchParams),
    queryFn: fetchAuthorAffiliationSearch,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const useAuthorAffiliationExport: ExportQuery = (params, options) => {
  const mergedMeta = mergeMeta(options?.meta, {
    params,
    uiTag: UI_TAGS.ACTIONS_AUTHOR_AFF_EXPORT,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    string,
    Error | AxiosError,
    string,
    ReturnType<typeof authorAffiliationsKeys.export>
  >;

  return useQuery({
    queryKey: authorAffiliationsKeys.export(params),
    queryFn: fetchAuthorAffiliationExport,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchAuthorAffiliationSearch: QueryFunction<IAuthorAffiliationResponse['data']> = async ({ meta }) => {
  const { params, uiTag } = meta as { params: IAuthorAffiliationPayload; uiTag?: UiTag };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.AUTHOR_AFFILIATION_SEARCH,
    data: params,
    uiTag: uiTag ?? UI_TAGS.RESULTS_AUTHOR_AFF_SEARCH,
  };

  const { data } = await api.request<IAuthorAffiliationResponse>(config);

  return data.data;
};

export const fetchAuthorAffiliationExport: QueryFunction<string> = async ({ meta }) => {
  const { params, uiTag } = meta as { params: IAuthorAffiliationExportPayload; uiTag?: UiTag };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.AUTHOR_AFFILIATION_EXPORT,
    data: params,
    uiTag: uiTag ?? UI_TAGS.ACTIONS_AUTHOR_AFF_EXPORT,
  };

  const { data } = await api.request<string>(config);

  return data;
};

import { QueryFunction, UseQueryOptions, useQuery } from '@tanstack/react-query';
import api, { ApiRequestConfig } from '../api';
import { ApiTargets } from '../models';
import { ADSQuery } from '../types';
import { ICitationHelperParams, ICitationHelperResponse } from './types';
import { UI_TAGS, UiTag } from '@/sentry/uiTags';
import type { AxiosError } from 'axios';

export const citationHelperKeys = {
  search: (params: ICitationHelperParams) => ['citationhelper', params] as const,
};

const mergeMeta = (meta: unknown, extras: Record<string, unknown>): Record<string, unknown> => ({
  ...(typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {}),
  ...extras,
});

export const useCitationHelper: ADSQuery<ICitationHelperParams, ICitationHelperResponse> = (params, options) => {
  const mergedMeta = mergeMeta(options?.meta, { params, uiTag: UI_TAGS.RESULTS_CITATION_HELPER });
  const safeOptions = (options ?? {}) as UseQueryOptions<
    ICitationHelperResponse,
    Error | AxiosError,
    ICitationHelperResponse,
    ReturnType<typeof citationHelperKeys.search>
  >;

  return useQuery({
    queryKey: citationHelperKeys.search(params),
    queryFn: fetchCitationHelper,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchCitationHelper: QueryFunction<ICitationHelperResponse> = async ({ meta }) => {
  const { params, uiTag } = meta as { params: ICitationHelperParams; uiTag?: UiTag };

  const config: ApiRequestConfig = {
    method: 'POST',
    url: ApiTargets.SERVICE_CITATION_HELPER,
    data: params,
    uiTag: uiTag ?? UI_TAGS.RESULTS_CITATION_HELPER,
  };

  const { data } = await api.request<ICitationHelperResponse>(config);

  return data;
};

import { isNil } from 'ramda';
import { QueryFunction, UseQueryOptions, useQuery, UseQueryResult } from '@tanstack/react-query';
import { IADSApiGraphicsParams, IADSApiGraphicsResponse } from './types';
import { IDocsEntity } from '@/api/search/types';
import { ADSQuery } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';
import { UI_TAGS, UiTag } from '@/sentry/uiTags';
import type { AxiosError } from 'axios';

const MAX_RETRIES = 3;

export type UseGraphicsResult = UseQueryResult<Partial<IADSApiGraphicsResponse>>;

export const graphicsKeys = {
  primary: (bibcode: IDocsEntity['bibcode']) => ['graphics', { bibcode }] as const,
};

const retryFn = (count: number, error: unknown) => {
  if (count >= MAX_RETRIES || (error instanceof Error && error.message.startsWith('No database entry'))) {
    return false;
  }

  return true;
};

const mergeMeta = (meta: unknown, extras: Record<string, unknown>): Record<string, unknown> => ({
  ...(typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {}),
  ...extras,
});

/**
 * Fetches graphics and returns true if the request returns successfully
 */
export const useGetGraphicsCount: ADSQuery<
  IDocsEntity['bibcode'],
  IADSApiGraphicsResponse,
  IADSApiGraphicsResponse,
  number
> = (bibcode, options) => {
  const params = { bibcode };

  const mergedMeta = mergeMeta(options?.meta, {
    params,
    uiTag: UI_TAGS.RESULTS_GRAPHICS,
    skipGlobalErrorHandler: true,
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IADSApiGraphicsResponse,
    Error | AxiosError,
    IADSApiGraphicsResponse,
    ReturnType<typeof graphicsKeys.primary>
  >;

  const { data } = useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    ...safeOptions,
    meta: mergedMeta,
  });

  return data?.figures?.length ?? 0;
};

/**
 * Get graphics based on bibcode
 */
export const useGetGraphics: ADSQuery<IDocsEntity['bibcode'], IADSApiGraphicsResponse> = (bibcode, options) => {
  const params = { bibcode };
  const mergedMeta = mergeMeta(options?.meta, { params, uiTag: UI_TAGS.RESULTS_GRAPHICS });
  const safeOptions = (options ?? {}) as UseQueryOptions<
    IADSApiGraphicsResponse,
    Error | AxiosError,
    IADSApiGraphicsResponse,
    ReturnType<typeof graphicsKeys.primary>
  >;
  return useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchGraphics: QueryFunction<IADSApiGraphicsResponse> = async ({ meta }) => {
  const { params, uiTag } = meta as { params: IADSApiGraphicsParams; uiTag?: UiTag };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.GRAPHICS}/${params.bibcode}`,
    uiTag: uiTag ?? UI_TAGS.RESULTS_GRAPHICS,
  };

  const { data: graphics } = await api.request<IADSApiGraphicsResponse>(config);

  if (isNil(graphics) || graphics.Error) {
    return null;
  }

  return graphics;
};

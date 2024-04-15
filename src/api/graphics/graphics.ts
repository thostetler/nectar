import { isNil } from 'ramda';
import { useQuery, UseQueryResult } from '@tanstack/react-query';
import { IADSApiGraphicsParams, IADSApiGraphicsResponse } from './types';
import { IDocsEntity } from '@/api/search';
import { ADSQuery, QueryFunctionSsr } from '@/api/types';
import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';

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

/**
 * Fetches graphics and returns true if the request returns successfully
 */
export const useHasGraphics: ADSQuery<IDocsEntity['bibcode'], IADSApiGraphicsResponse, null, boolean> = (
  bibcode,
  options,
) => {
  const params = { bibcode };

  const { data } = useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    meta: { params, skipGlobalErrorHandler: true },
    ...options,
  });

  return !isNil(data);
};

/**
 * Get graphics based on bibcode
 */
export const useGetGraphics: ADSQuery<IDocsEntity['bibcode'], IADSApiGraphicsResponse> = (bibcode, options) => {
  const params = { bibcode };
  return useQuery({
    queryKey: graphicsKeys.primary(bibcode),
    queryFn: fetchGraphics,
    retry: retryFn,
    meta: { params },
    ...options,
  });
};

export const fetchGraphics: QueryFunctionSsr<IADSApiGraphicsResponse> = async ({ meta }, options) => {
  const { params } = meta as { params: IADSApiGraphicsParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.GRAPHICS}/${params.bibcode}`,
  };

  if (typeof window === 'undefined' && options?.token && options?.token.length > 0) {
    const { data: graphics } = await api.ssrRequest<IADSApiGraphicsResponse>(config, options);

    if (isNil(graphics) || graphics.Error) {
      return null;
    }

    return graphics;
  }

  const { data: graphics } = await api.request<IADSApiGraphicsResponse>(config);

  if (isNil(graphics) || graphics.Error) {
    return null;
  }

  return graphics;
};

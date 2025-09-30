import { QueryFunction, useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import api, { ApiRequestConfig } from '../api';
import { ExportApiFormatKey, ExportFormatsApiResponse, IExportApiParams, IExportApiResponse } from './types';
import { ADSQuery } from '@/api/types';
import { ApiTargets } from '@/api/models';
import { UiTag, buildExportTag } from '@/sentry/uiTags';
import type { AxiosError } from 'axios';

export type UseExportCitationResult = UseQueryResult<Partial<IExportApiResponse>>;

export const exportCitationKeys = {
  manifest: () => ['manifest'] as const,
  primary: (params: IExportApiParams) => ['exportcitation', { params }] as const,
};

const mergeMeta = (meta: unknown, extras: Record<string, unknown>): Record<string, unknown> => ({
  ...(typeof meta === 'object' && meta !== null ? (meta as Record<string, unknown>) : {}),
  ...extras,
});

export const useGetExportFormats = (options?: UseQueryOptions<ExportFormatsApiResponse>) => {
  return useQuery({
    queryKey: exportCitationKeys.manifest(),
    queryFn: fetchExportFormats,
    ...options,
  });
};

/**
 * Get exports based on bibcode(s)
 */
export const useGetExportCitation: ADSQuery<IExportApiParams, IExportApiResponse> = (params, options) => {
  const formatTag =
    params.format === ExportApiFormatKey.custom ? params.customFormat ?? ExportApiFormatKey.custom : params.format;

  const mergedMeta = mergeMeta(options?.meta, {
    params,
    uiTag: buildExportTag(String(formatTag)),
  });

  const safeOptions = (options ?? {}) as UseQueryOptions<
    IExportApiResponse,
    Error | AxiosError,
    IExportApiResponse,
    ReturnType<typeof exportCitationKeys.primary>
  >;

  return useQuery({
    queryKey: exportCitationKeys.primary(params),
    queryFn: fetchExportCitation,
    ...safeOptions,
    meta: mergedMeta,
  });
};

export const fetchExportFormats: QueryFunction<ExportFormatsApiResponse> = async () => {
  const config: ApiRequestConfig = {
    method: 'GET',
    url: ApiTargets.EXPORT_MANIFEST,
    uiTag: buildExportTag('manifest'),
  };

  const { data } = await api.request<ExportFormatsApiResponse>(config);

  return data;
};

export const fetchExportCitation: QueryFunction<IExportApiResponse> = async ({ meta }) => {
  const {
    params: { customFormat, format, ...params },
    uiTag,
  } = meta as { params: IExportApiParams; uiTag?: UiTag };

  // custom format is "format" if format === 'custom'
  // otherwise "format" isn't passed, so we strip them here and do that logic

  const config: ApiRequestConfig = {
    method: 'POST',
    url: `${ApiTargets.EXPORT}/${format}`,
    data: {
      ...params,
      ...(format === ExportApiFormatKey.custom ? { format: customFormat } : {}),
    },
    uiTag: uiTag ?? buildExportTag(String(format)),
  };

  const { data } = await api.request<IExportApiResponse>(config);

  return data;
};

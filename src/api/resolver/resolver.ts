import api, { ApiRequestConfig } from '@/api/api';
import { ApiTargets } from '@/api/models';
import { ADSQuery, QueryFunctionSsr } from '@/api/types';
import { useQuery } from '@tanstack/react-query';
import { IADSApiResolverParams, IADSApiResolverResponse } from './types';

export enum ResolverKeys {
  LINKS = 'resolver/links',
}

export const resolverKeys = {
  links: (params: IADSApiResolverParams) => [ResolverKeys.LINKS, params] as const,
};

export const useResolverQuery: ADSQuery<IADSApiResolverParams, IADSApiResolverResponse> = (params, options) => {
  return useQuery({
    queryKey: resolverKeys.links(params),
    queryFn: fetchLinks,
    meta: { params },
    ...options,
  });
};

export const fetchLinks: QueryFunctionSsr<IADSApiResolverResponse> = async ({ meta }, options) => {
  const { params } = meta as { params: IADSApiResolverParams };

  const config: ApiRequestConfig = {
    method: 'GET',
    url: `${ApiTargets.RESOLVER}/${params.bibcode}/${params.link_type}`,
    validateStatus: (status) => status === 200 || status === 404,
  };

  if (typeof window === 'undefined' && options?.token && options?.token.length > 0) {
    const { data } = await api.ssrRequest<IADSApiResolverResponse>(config, options);
    return data;
  }

  const { data } = await api.request<IADSApiResolverResponse>(config);
  return data;
};

import { AxiosError } from 'axios';
import {
  QueryFunctionContext,
  QueryKey,
  UseInfiniteQueryOptions,
  UseInfiniteQueryResult,
  UseMutationOptions,
  UseMutationResult,
  UseQueryOptions,
  UseQueryResult,
  UseSuspenseQueryOptions,
  UseSuspenseQueryResult,
} from '@tanstack/react-query';
import { GetServerSidePropsContext } from 'next';

export type ADSQuery<
  TProps,
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TResult = UseQueryResult<TData, Error | AxiosError>,
  TQueryKey extends QueryKey = QueryKey,
> = (props: TProps, options?: Partial<UseQueryOptions<TQueryFnData, Error | AxiosError, TData, TQueryKey>>) => TResult;

export type ADSSuspenseQuery<
  TProps,
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TResult = UseSuspenseQueryResult<TData, Error | AxiosError>,
  TQueryKey extends QueryKey = QueryKey,
> = (
  props: TProps,
  options?: Partial<UseSuspenseQueryOptions<TQueryFnData, Error | AxiosError, TData, TQueryKey>>,
) => TResult;

export type InfiniteADSQuery<
  TProps,
  TQueryFnData = unknown,
  TData = TQueryFnData,
  TQueryData = TQueryFnData,
  TResult = UseInfiniteQueryResult<TData, Error | AxiosError>,
  TQueryKey extends QueryKey = QueryKey,
> = (
  props: TProps,
  options?: Partial<UseInfiniteQueryOptions<TQueryFnData, Error | AxiosError, TData, TQueryData, TQueryKey, string>>,
) => TResult;

export type ADSMutation<
  TData,
  TParams,
  TVariables,
  TError = Error | AxiosError,
  TResult = UseMutationResult<TData, TError, TVariables>,
> = (params?: TParams, options?: Partial<UseMutationOptions<TData, TError, TVariables>>) => TResult;

export type QueryFunctionSsr<T = unknown, TQueryKey extends QueryKey = QueryKey> = (
  context: QueryFunctionContext<TQueryKey>,
  options?: {
    token: string;
    headers: GetServerSidePropsContext['req']['headers'];
  },
) => T | Promise<T>;

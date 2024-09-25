import { SolrSort } from '@/api';
import { APP_DEFAULTS } from '@/config';
import { NumPerPageType } from '@/types';
import qs from 'qs';
import { ParsedUrlQuery } from 'querystring';
import { clamp, is, keys } from 'ramda';

type ParsedQueryParams = ParsedUrlQuery | qs.ParsedQs;

/**
 * Takes in raw URL parameters and converts values into strings, returns an object
 */
export const normalizeURLParams = <T extends Record<string, string> = Record<string, string>>(
  query: ParsedQueryParams,
  skipKeys: string[] = [],
): T => {
  return Object.keys(query).reduce((acc, key) => {
    if (skipKeys.includes(key)) {
      return acc;
    }
    const rawValue: unknown = query[key];
    const value = typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue.join(',') : undefined;

    if (typeof value === 'undefined') {
      return acc;
    }

    return {
      ...acc,
      [key]: value,
    };
  }, {}) as T;
};

/**
 * Helper utility for clamping the resulting number between min/max
 */
export const parseNumberAndClamp = (
  value: string | number | (number | string)[],
  min: number,
  max: number = Number.MAX_SAFE_INTEGER,
): number => {
  try {
    const val = Array.isArray(value) ? value[0] : value;
    const num = typeof val === 'number' ? val : parseInt(val, 10);
    return clamp(min, max, Number.isNaN(num) ? min : num);
  } catch (e) {
    return min;
  }
};

export const isNumPerPageType = (value: number): value is NumPerPageType => {
  return APP_DEFAULTS.PER_PAGE_OPTIONS.includes(value as NumPerPageType);
};

/**
 * Helper to parse query params into API search parameters
 */


// detects if passed in value is a valid SolrSort
export const isSolrSort = (maybeSolrSort: string): maybeSolrSort is SolrSort => {
  return [
    'author_count asc',
    'author_count desc',
    'bibcode asc',
    'bibcode desc',
    'citation_count asc',
    'citation_count desc',
    'citation_count_norm asc',
    'citation_count_norm desc',
    'classic_factor asc',
    'classic_factor desc',
    'first_author asc',
    'first_author desc',
    'date asc',
    'date desc',
    'entry_date asc',
    'entry_date desc',
    'id asc',
    'id desc',
    'read_count asc',
    'read_count desc',
    'score asc',
    'score desc',
  ].includes(maybeSolrSort);
};

// checks if passed in value is valid string
export const isString = (maybeString: unknown): maybeString is string => typeof maybeString === 'string';


const qTransformers = (q: string) => {
  if (typeof q === 'string') {
    return q.replace(/“/g, '"').replace(/”/g, '"');
  }
  return q;
};

const parseSearchParams = (params: string, options?: qs.IParseOptions) => {
  const parsed = qs.parse(params, { parseArrays: true, charset: 'utf-8', ...options });
  parsed.q = qTransformers(parsed.q as string);
  return parsed;
};

export const isEmptyObject = (value: unknown) => {
  return is(Object) && keys(value).length === 0;
};


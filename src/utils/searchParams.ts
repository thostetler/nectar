import { ParsedUrlQuery } from 'querystring';
import { IADSApiSearchParams, SolrSort } from '@/api';
import { clamp, filter, head, last, omit, uniq } from 'ramda';
import { APP_DEFAULTS } from '@/config';
import qs from 'qs';
import { isIADSSearchParams, isNumPerPageType } from '@/utils/typeGuards';
import { logger } from '@/logger';
import { SafeSearchUrlParams } from '@/types';
import { isSolrSort, isString } from '@/utils';

const ALLOWED_PARAMS = [
  'q', 'sort', 'p', 'n', 'fq',
  'fq_author_facet_hier',
  'fq_database',
  'fq_property',
  'fq_aff_facet_hier',
  'fq_keyword_facet',
  'fq_bibstem_facet',
  'fq_bibgroup_facet',
  'fq_simbad_object_facet_hier',
  'fq_ned_object_facet_hier',
  'fq_data_facet',
  'fq_vizier_facet',
  'fq_doctype_facet_hier',
  'fq_gpn_facet_hier_3level',
];

/**
 * Helper utility for clamping the resulting number between min/max
 * @param {string | number | (number | string)[]} value - The input value to be parsed and clamped
 * @param {number} min - The minimum boundary for clamping
 * @param {number} max - The maximum boundary for clamping (defaults to Number.MAX_SAFE_INTEGER)
 * @returns {number} - Returns the clamped number
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
  } catch (err) {
    logger.error({ err });
    return min;
  }
};

/**
 * Normalizes URL parameters by converting values into strings, while filtering out any unwanted parameters
 * @param {ParsedUrlQuery | qs.ParsedQs} query - The parsed URL query parameters
 * @param {string[]} allowedKeys - Array of allowed parameter keys
 * @returns {T} - Normalized URL parameters as a key-value object
 */
export const normalizeURLParams = <T extends Record<string, string | string[]> = Record<string, string | string[]>>(
  query: ParsedUrlQuery | qs.ParsedQs,
  allowedKeys: string[] = ALLOWED_PARAMS,
): T => {
  try {
    return Object.keys(query)
      .filter((key) => allowedKeys.includes(key)) // Filter only allowed keys
      .reduce((acc, key) => {
        const rawValue: unknown = query[key];
        const value = typeof rawValue === 'string' ? rawValue : Array.isArray(rawValue) ? rawValue.join(',') : undefined;

        // replace 'smart quotes' in query
        if (key === 'q' && typeof value === 'string') {
          value.replace(/“/g, '"').replace(/”/g, '"');
        }

        if (typeof value === 'undefined') {
          return acc;
        }

        return {
          ...acc,
          [key]: value,
        };
      }, {} as T);
  } catch (err) {
    logger.error({ err });
    return {} as T;
  }
};

/**
 * Normalizes a raw SolrSort value into a valid SolrSort array
 * @param {unknown} rawSolrSort - Raw SolrSort value from query
 * @param {SolrSort} [postfixSort] - Optional postfix sort value
 * @returns {SolrSort[]} - Array of valid SolrSort strings
 */
export const normalizeSolrSort = (rawSolrSort: unknown, postfixSort?: SolrSort): SolrSort[] => {
  const sort = Array.isArray(rawSolrSort)
    ? filter(isString, rawSolrSort)
    : isString(rawSolrSort)
      ? rawSolrSort.split(',')
      : null;

  const tieBreaker = postfixSort || APP_DEFAULTS.QUERY_SORT_POSTFIX;

  if (sort === null) {
    return ['score desc', tieBreaker]; // Default value if no valid sort is provided
  }

  const validSort = uniq(filter(isSolrSort, sort)); // Filter out invalid sort values

  if (tieBreaker === last(validSort)) {
    return validSort;
  }

  if (validSort.length === 0) {
    return ['score desc', tieBreaker]; // Default sort if all values are filtered out
  }

  return uniq(validSort.concat(tieBreaker));
};

/**
 * Parses query parameters from a URL string or Next.js searchParams, and normalizes them.
 * @param {string | ParsedUrlQuery} [urlOrParams=''] - The URL string to parse or Next.js searchParams
 * @param {object} [options] - Optional settings, such as sortPostfix
 * @param {SolrSort} [options.sortPostfix] - Postfix value for sorting
 * @returns {IADSApiSearchParams & { p?: number; n?: number }} - Parsed and normalized query parameters
 */
export const parseQueryFromUrl = <TExtra extends Record<string, string | number | Array<string | number>>>(
  urlOrParams: string | ParsedUrlQuery = '',
  { sortPostfix }: { sortPostfix?: SolrSort } = {},
) => {
  try {
    let params: Record<string, string | string[]>;

    // If it's a URL string, we need to parse it using qs
    if (typeof urlOrParams === 'string') {
      const queryString = urlOrParams.indexOf('?') === -1 ? urlOrParams : urlOrParams.split('?')[1];
      params = qs.parse(queryString, {
        parseArrays: true,
        charset: 'utf-8',
      }) as Record<string, string | string[]>;
    } else {
      // If it's already an object (Next.js searchParams), no need to parse
      params = urlOrParams as Record<string, string | string[]>;
    }


    const normalizedParams = normalizeURLParams(params);

    // If the normalizedParams meet the expected shape of IADSApiSearchParams, proceed
    if (isIADSSearchParams(normalizedParams)) {
      const q = decodeURIComponent(normalizedParams.q ?? '');
      const numPerPage = parseNumberAndClamp(
        normalizedParams.n,
        head(APP_DEFAULTS.PER_PAGE_OPTIONS),
        last(APP_DEFAULTS.PER_PAGE_OPTIONS),
      );

      return {
        ...normalizedParams,
        q: q === '' ? APP_DEFAULTS.EMPTY_QUERY : q,
        sort: normalizeSolrSort(params.sort, sortPostfix),
        p: parseNumberAndClamp(normalizedParams.p, 1),
        n: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE,
        ...(params.fq ? { fq: safeSplitString(params.fq) } : {}),
      } as IADSApiSearchParams & { p?: number; n?: number } & TExtra;
    }

    // Fallback in case of invalid params
    return {} as IADSApiSearchParams & { p?: number; n?: number } & TExtra;
  } catch (err) {
    logger.error({ err });
    return {} as IADSApiSearchParams & { p?: number; n?: number } & TExtra;
  }
};


/**
 * Safely splits a string into an array based on the provided delimiter
 * @param {string | string[]} value - The string or array to be split
 * @param {string | RegExp} [delimiter=','] - The delimiter used for splitting (default is comma)
 * @returns {string[]} - An array of split values
 */
export const safeSplitString = (value: string | string[], delimiter: string | RegExp = ','): string[] => {
  try {
    if (Array.isArray(value)) {
      return value;
    }

    if (isString(value)) {
      return value.split(delimiter);
    }
  } catch (err) {
    logger.error({ err });
    return [];
  }
};

/**
 * Wrapper around `qs.stringify` with defaults
 */
export const stringifySearchParams = (params: Record<string, unknown>, options?: qs.IStringifyOptions) =>
  qs.stringify(params, {
    indices: false,
    arrayFormat: 'repeat',
    format: 'RFC1738',
    sort: (a, b) => a - b,
    skipNulls: true,
    ...options,
  });
// omit params that should not be included in any urls
// `id` is typically slug used in abstract pages
const omitSearchParams = omit(['fl', 'start', 'rows', 'id']);
/**
 * Generates a string for use in URLs, this assumes we want to include `sort` and `p` so those values
 * are normalized or added.
 *
 * @returns {string} clean search string for use after `?` in URLs.
 */
export const makeSearchParams = (params: SafeSearchUrlParams, options: { omit?: string[] } = {}): string => {
  const cleanParams = omitSearchParams(params);
  const numPerPage = parseNumberAndClamp(
    cleanParams?.n as string,
    head(APP_DEFAULTS.PER_PAGE_OPTIONS),
    last(APP_DEFAULTS.PER_PAGE_OPTIONS),
  );

  return stringifySearchParams(
    omit(options.omit ?? [], {
      ...cleanParams,
      sort: normalizeSolrSort(cleanParams.sort),
      p: parseNumberAndClamp(cleanParams?.p as string, 1),
      n: isNumPerPageType(numPerPage) ? numPerPage : APP_DEFAULTS.RESULT_PER_PAGE,
    }),
  );
};

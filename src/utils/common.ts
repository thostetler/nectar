// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isArray, isNilOrEmpty, isNonEmptyString, isNotString } from 'ramda-adjunct';
import { head, pipe, when } from 'ramda';
import DOMPurify from 'isomorphic-dompurify';

export const noop = (..._args: unknown[]): void => {
  // do nothing
};

/**
 * Truncate number to a certain precision
 */
export const truncateDecimal = (num: number, d: number): number => {
  const regex = new RegExp(`^-?\\d+(\\.\\d{0,${d}})?`);
  return parseFloat(regex.exec(num.toString())[0]);
};
/**
 * Capitalizes first letter of the string
 * @param str
 */
export const capitalizeString = (str: string) =>
  isNonEmptyString(str) ? `${str.slice(0, 1).toUpperCase()}${str.slice(1)}` : str;
/**
 * Takes an array or simple string
 * @example
 * unwrapStringValue(['a', 'b', 'c']) ==> 'a'
 * unwrapStringValue('abc') ==> 'abc'
 * unwrapStringValue(555) ==> ''
 */
export const unwrapStringValue = pipe<[string | string[]], string, string>(
  when(isArray, head),
  when(isNotString, () => ''),
);
export const purifyString = (value: string): string => {
  try {
    return DOMPurify.sanitize(value);
  } catch (e) {
    return value;
  }
};
export const pluralize = (str: string, count: number) => {
  return count === 1 ? str : `${str}s`;
};
export const parsePublicationDate = (pubdate: string): { year: string; month: string; day: string } | null => {
  if (isNilOrEmpty(pubdate)) {
    return null;
  }

  const regex = /^(\d{4})-(\d{2})-(\d{2})$/;
  const match: RegExpExecArray | null = regex.exec(pubdate);

  // handle dates with year, month, and day
  if (match && match.length === 4) {
    return { year: match[1], month: match[2], day: match[3] };
  } else {
    // handle dates with only year and month
    const year = pubdate.slice(0, 4);
    const monthMatch = /^(\d{4})-(\d{2})$/.exec(pubdate);
    const month = monthMatch ? monthMatch[2] : '00';
    return { year, month, day: '00' };
  }
}; // todo: should be moved to somewhere more specific
export const getFomattedNumericPubdate = (pubdate: string): string | null => {
  const regex = /^(?<year>\d{4})-(?<month>\d{2})/;
  const match = regex.exec(pubdate);
  if (match === null) {
    return null;
  }
  const { year, month } = match.groups;
  return `${year}/${month}`;
};
export const isBrowser = (): boolean => typeof window !== 'undefined';

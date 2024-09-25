import axios, { AxiosError } from 'axios';
import { find, paths, pipe } from 'ramda';
import { isString } from 'ramda-adjunct';

/**
 * Unwrap and parse an error message
 * If the error is an axios specific one, then try to grab any returned error message
 *
 */
type getErrorMessageOptions = {
  defaultMessage: string;
};
export const parseAPIError = (
  error: AxiosError<unknown> | Error | unknown,
  options: getErrorMessageOptions = {
    defaultMessage: 'Unknown Server Error',
  },
): string => {
  const pathStrings = [
    ['user-message'],
    ['response', 'data', 'user-message'],
    ['response', 'data', 'message'],
    ['response', 'data', 'error'],
    ['response', 'statusText'],
    ['message'],
  ];

  // if it's a simple string, return it as is
  if (typeof error === 'string') {
    return error;
  }

  // return generic message if error is invalid
  if (!error || !(error instanceof Error)) {
    return options.defaultMessage;
  }

  // if error is an axios error, check for a message
  if (axios.isAxiosError(error)) {
    const message = pipe<[AxiosError], (string | undefined)[], string | undefined>(
      paths(pathStrings),
      find(isString),
    )(error);

    if (typeof message === 'string') {
      return message;
    }
  }

  if (error instanceof Error && typeof error.message === 'string' && error.message.length > 0) {
    return error.message;
  }

  return options.defaultMessage;
};

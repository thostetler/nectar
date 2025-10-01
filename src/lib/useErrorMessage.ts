import { useEffect, useRef, useState } from 'react';

/**
 * Display an error message for a set amount of time
 *
 * @param error
 * @param delay
 */
export const useErrorMessage = <T>(error: T, delay = 5000) => {
  const timeoutId = useRef<number | null>(null);
  const state = useState<T>(error);
  const [message, setMessage] = state;

  useEffect(() => {
    setMessage(error);
  }, [error, setMessage]);

  useEffect(() => {
    if (timeoutId.current !== null) {
      clearTimeout(timeoutId.current);
    }

    if (message == null) {
      return;
    }

    timeoutId.current = window.setTimeout(() => {
      setMessage(null as unknown as T);
    }, delay);

    return () => {
      if (timeoutId.current !== null) {
        clearTimeout(timeoutId.current);
      }
    };
  }, [delay, message, setMessage]);

  return state;
};

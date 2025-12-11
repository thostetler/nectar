import { useEffect, useRef, useState } from 'react';

/**
 * Display an error message for a set amount of time
 *
 * @param error
 * @param delay
 */
export const useErrorMessage = <T>(error: T, delay = 5000) => {
  const id = useRef<number | null>(null);
  const [errorValue, setError] = useState<T>(error);

  useEffect(() => {
    id.current = window.setTimeout(setError, delay, null);
    return () => clearTimeout(id.current);
  }, [errorValue, delay]);

  return [errorValue, setError] as const;
};

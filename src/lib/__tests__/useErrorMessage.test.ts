import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useErrorMessage } from '../useErrorMessage';

describe('useErrorMessage', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('basic functionality', () => {
    it('should return the initial error value', () => {
      const { result } = renderHook(() => useErrorMessage('Test error'));
      expect(result.current[0]).toBe('Test error');
    });

    it('should return a setter function', () => {
      const { result } = renderHook(() => useErrorMessage('Test error'));
      expect(typeof result.current[1]).toBe('function');
    });

    it('should clear error after default delay (5000ms)', () => {
      const { result } = renderHook(() => useErrorMessage('Test error'));

      expect(result.current[0]).toBe('Test error');

      act(() => {
        vi.advanceTimersByTime(5000);
      });

      expect(result.current[0]).toBe(null);
    });

    it('should clear error after custom delay', () => {
      const { result } = renderHook(() => useErrorMessage('Test error', 3000));

      expect(result.current[0]).toBe('Test error');

      // Before delay
      act(() => {
        vi.advanceTimersByTime(2999);
      });
      expect(result.current[0]).toBe('Test error');

      // After delay
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(result.current[0]).toBe(null);
    });
  });

  describe('different error types', () => {
    it('should handle string errors', () => {
      const { result } = renderHook(() => useErrorMessage('String error'));
      expect(result.current[0]).toBe('String error');
    });

    it('should handle object errors', () => {
      const errorObj = { message: 'Error occurred', code: 500 };
      const { result } = renderHook(() => useErrorMessage(errorObj));
      expect(result.current[0]).toEqual(errorObj);
    });

    it('should handle Error instances', () => {
      const error = new Error('Test error');
      const { result } = renderHook(() => useErrorMessage(error));
      expect(result.current[0]).toBe(error);
    });

    it('should handle null as initial error', () => {
      const { result } = renderHook(() => useErrorMessage(null));
      expect(result.current[0]).toBe(null);
    });

    it('should handle undefined as initial error', () => {
      const { result } = renderHook(() => useErrorMessage(undefined));
      expect(result.current[0]).toBe(undefined);
    });

    it('should handle number errors', () => {
      const { result } = renderHook(() => useErrorMessage(404));
      expect(result.current[0]).toBe(404);
    });
  });

  describe('timer management', () => {
    it('should not clear error before delay expires', () => {
      const { result } = renderHook(() => useErrorMessage('Test error', 1000));

      act(() => {
        vi.advanceTimersByTime(999);
      });

      expect(result.current[0]).toBe('Test error');
    });

    it('should cleanup timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');
      const { unmount } = renderHook(() => useErrorMessage('Test error'));

      unmount();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should handle very short delays', () => {
      const { result } = renderHook(() => useErrorMessage('Test error', 1));

      act(() => {
        vi.advanceTimersByTime(1);
      });

      expect(result.current[0]).toBe(null);
    });

    it('should handle very long delays', () => {
      const { result } = renderHook(() => useErrorMessage('Test error', 60000));

      // After 59 seconds
      act(() => {
        vi.advanceTimersByTime(59000);
      });
      expect(result.current[0]).toBe('Test error');

      // After 60 seconds
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(result.current[0]).toBe(null);
    });

    it('should handle zero delay', () => {
      const { result } = renderHook(() => useErrorMessage('Test error', 0));

      act(() => {
        vi.advanceTimersByTime(0);
      });

      expect(result.current[0]).toBe(null);
    });
  });

  describe('re-renders and updates', () => {
    it('should maintain error value across re-renders', () => {
      const { result, rerender } = renderHook(() => useErrorMessage('Test error'));

      expect(result.current[0]).toBe('Test error');

      rerender();

      expect(result.current[0]).toBe('Test error');
    });

    it('should allow manual error updates via setter', () => {
      const { result } = renderHook(() => useErrorMessage('Initial error'));

      act(() => {
        result.current[1]('Updated error');
      });

      expect(result.current[0]).toBe('Updated error');
    });

    it('should allow clearing error manually', () => {
      const { result } = renderHook(() => useErrorMessage('Test error'));

      act(() => {
        result.current[1](null);
      });

      expect(result.current[0]).toBe(null);
    });

    it('should reset timer when error changes', () => {
      const { result } = renderHook(({ error, delay }) => useErrorMessage(error, delay), {
        initialProps: { error: 'Error 1', delay: 5000 },
      });

      // Advance time partway
      act(() => {
        vi.advanceTimersByTime(2500);
      });

      // Manually update error (simulating new error)
      act(() => {
        result.current[1]('Error 2');
      });

      // Original timer should have been cleaned up
      // Error should still be present
      expect(result.current[0]).toBe('Error 2');
    });
  });

  describe('edge cases', () => {
    it('should handle boolean errors', () => {
      const { result } = renderHook(() => useErrorMessage(true));
      expect(result.current[0]).toBe(true);
    });

    it('should handle array errors', () => {
      const errors = ['Error 1', 'Error 2'];
      const { result } = renderHook(() => useErrorMessage(errors));
      expect(result.current[0]).toEqual(errors);
    });

    it('should handle nested object errors', () => {
      const complexError = {
        message: 'Error',
        details: {
          code: 500,
          fields: ['field1', 'field2'],
        },
      };
      const { result } = renderHook(() => useErrorMessage(complexError));
      expect(result.current[0]).toEqual(complexError);
    });
  });
});

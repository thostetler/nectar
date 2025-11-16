import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useDebounce } from '../useDebounce';

describe('useDebounce', () => {
  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('initial', 500));

    expect(result.current).toBe('initial');
  });

  it('should debounce value changes with default delay (500ms)', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 500), {
      initialProps: { value: 'initial' },
    });

    expect(result.current).toBe('initial');

    // Change value
    rerender({ value: 'changed' });

    // Should still be initial immediately after change
    expect(result.current).toBe('initial');

    // After 500ms, should be updated
    await waitFor(
      () => {
        expect(result.current).toBe('changed');
      },
      { timeout: 1000 },
    );
  });

  it('should debounce value changes with custom delay', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 1000), {
      initialProps: { value: 'initial' },
    });

    rerender({ value: 'changed' });
    expect(result.current).toBe('initial');

    // Should NOT be updated after 500ms
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(result.current).toBe('initial');

    // Should be updated after 1000ms
    await waitFor(
      () => {
        expect(result.current).toBe('changed');
      },
      { timeout: 1100 },
    );
  });

  it('should cancel previous timeout when value changes rapidly', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 300), {
      initialProps: { value: 'first' },
    });

    // Rapid changes
    rerender({ value: 'second' });
    await new Promise((resolve) => setTimeout(resolve, 100));

    rerender({ value: 'third' });
    await new Promise((resolve) => setTimeout(resolve, 100));

    rerender({ value: 'fourth' });

    // Should still be first during debounce
    expect(result.current).toBe('first');

    // After delay, should jump directly to last value
    await waitFor(
      () => {
        expect(result.current).toBe('fourth');
      },
      { timeout: 400 },
    );
  });

  it('should handle different value types', async () => {
    // Number
    const { result: numberResult, rerender: numberRerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: 0 },
    });

    numberRerender({ value: 42 });
    await waitFor(() => {
      expect(numberResult.current).toBe(42);
    });

    // Boolean
    const { result: boolResult, rerender: boolRerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: false },
    });

    boolRerender({ value: true });
    await waitFor(() => {
      expect(boolResult.current).toBe(true);
    });

    // Object
    const obj1 = { id: 1 };
    const obj2 = { id: 2 };
    const { result: objResult, rerender: objRerender } = renderHook(({ value }) => useDebounce(value, 100), {
      initialProps: { value: obj1 },
    });

    objRerender({ value: obj2 });
    await waitFor(() => {
      expect(objResult.current).toBe(obj2);
    });
  });

  it('should handle undefined and null values', async () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce<string | null | undefined>(value, 100), {
      initialProps: { value: 'value' as string | null | undefined },
    });

    rerender({ value: null });
    await waitFor(() => {
      expect(result.current).toBe(null);
    });

    rerender({ value: undefined });
    await waitFor(() => {
      expect(result.current).toBe(undefined);
    });
  });

  it('should cleanup timeout on unmount', () => {
    const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout');

    const { unmount } = renderHook(() => useDebounce('test', 500));

    unmount();

    expect(clearTimeoutSpy).toHaveBeenCalled();
    clearTimeoutSpy.mockRestore();
  });

  it('should update delay dynamically', async () => {
    const { result, rerender } = renderHook(({ value, delay }) => useDebounce(value, delay), {
      initialProps: { value: 'initial', delay: 1000 },
    });

    // Change value with 1000ms delay
    rerender({ value: 'changed', delay: 1000 });

    // Change delay to 100ms
    rerender({ value: 'changed', delay: 100 });

    // Should update faster with new delay
    await waitFor(
      () => {
        expect(result.current).toBe('changed');
      },
      { timeout: 200 },
    );
  });
});

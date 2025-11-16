import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useIsClient } from '../useIsClient';

describe('useIsClient', () => {
  it('should return true in test environment (client-side)', () => {
    const { result } = renderHook(() => useIsClient());

    // In test environment, useEffect runs immediately, so it's always true
    // This hook is primarily useful for SSR vs client-side rendering distinction
    expect(result.current).toBe(true);
  });

  it('should consistently return true after mount', async () => {
    const { result } = renderHook(() => useIsClient());

    // Should be true
    expect(result.current).toBe(true);

    // Should remain true
    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });

  it('should remain true after re-renders', async () => {
    const { result, rerender } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });

    // Re-render and should still be true
    rerender();
    expect(result.current).toBe(true);

    rerender();
    expect(result.current).toBe(true);
  });

  it('should be consistent across multiple hook instances', async () => {
    const { result: result1 } = renderHook(() => useIsClient());
    const { result: result2 } = renderHook(() => useIsClient());

    await waitFor(() => {
      expect(result1.current).toBe(true);
      expect(result2.current).toBe(true);
    });
  });
});

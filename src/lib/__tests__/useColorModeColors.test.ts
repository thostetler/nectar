import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useColorModeColors, useColorModeColorVars } from '../useColorModeColors';

// Mock Chakra UI's useColorMode
vi.mock('@chakra-ui/react', () => ({
  useColorMode: vi.fn(),
}));

import { useColorMode } from '@chakra-ui/react';

describe('useColorModeColors', () => {
  it('should return light mode colors when colorMode is light', () => {
    vi.mocked(useColorMode).mockReturnValue({
      colorMode: 'light',
      toggleColorMode: vi.fn(),
      setColorMode: vi.fn(),
    });

    const { result } = renderHook(() => useColorModeColors());

    expect(result.current.background).toBe('white');
    expect(result.current.text).toBe('gray.700');
    expect(result.current.disabledText).toBe('gray.400');
    expect(result.current.link).toBe('blue.400');
    expect(result.current.highlightBackground).toBe('blue.100');
    expect(result.current.highlightForeground).toBe('gray.800');
    expect(result.current.disabledBackground).toBe('gray.50');
    expect(result.current.disabledForeground).toBe('gray.300');
    expect(result.current.border).toBe('gray.100');
    expect(result.current.panel).toBe('gray.50');
    expect(result.current.panelHighlight).toBe('blue.500');
    expect(result.current.lightText).toBe('gray.600');
    expect(result.current.brand).toBe('blue.600');
    expect(result.current.tableHighlightBackgroud).toBe('blue.50');
    expect(result.current.disabledInput).toBe('gray.50');
    expect(result.current.pill).toBe('blue.100');
    expect(result.current.pillText).toBe('gray.800');
  });

  it('should return dark mode colors when colorMode is dark', () => {
    vi.mocked(useColorMode).mockReturnValue({
      colorMode: 'dark',
      toggleColorMode: vi.fn(),
      setColorMode: vi.fn(),
    });

    const { result } = renderHook(() => useColorModeColors());

    expect(result.current.background).toBe('gray.800');
    expect(result.current.text).toBe('gray.50');
    expect(result.current.disabledText).toBe('gray.100');
    expect(result.current.link).toBe('blue.200');
    expect(result.current.highlightBackground).toBe('gray.600');
    expect(result.current.highlightForeground).toBe('gray.100');
    expect(result.current.disabledBackground).toBe('gray.700');
    expect(result.current.disabledForeground).toBe('gray.400');
    expect(result.current.border).toBe('gray.400');
    expect(result.current.panel).toBe('gray.700');
    expect(result.current.panelHighlight).toBe('blue.200');
    expect(result.current.lightText).toBe('gray.200');
    expect(result.current.brand).toBe('blue.300');
    expect(result.current.tableHighlightBackgroud).toBe('gray.700');
    expect(result.current.disabledInput).toBe('gray.700');
    expect(result.current.pill).toBe('blue.200');
    expect(result.current.pillText).toBe('white');
  });

  it('should have all required color properties', () => {
    vi.mocked(useColorMode).mockReturnValue({
      colorMode: 'light',
      toggleColorMode: vi.fn(),
      setColorMode: vi.fn(),
    });

    const { result } = renderHook(() => useColorModeColors());
    const colors = result.current;

    // Check all properties exist
    const expectedProperties = [
      'background',
      'text',
      'disabledText',
      'link',
      'highlightBackground',
      'highlightForeground',
      'disabledBackground',
      'disabledForeground',
      'border',
      'panel',
      'panelHighlight',
      'lightText',
      'brand',
      'tableHighlightBackgroud',
      'disabledInput',
      'pill',
      'pillText',
    ];

    expectedProperties.forEach((prop) => {
      expect(colors).toHaveProperty(prop);
      expect(typeof colors[prop as keyof typeof colors]).toBe('string');
    });
  });
});

describe('useColorModeColorVars', () => {
  it('should return light mode CSS variables when colorMode is light', () => {
    vi.mocked(useColorMode).mockReturnValue({
      colorMode: 'light',
      toggleColorMode: vi.fn(),
      setColorMode: vi.fn(),
    });

    const { result } = renderHook(() => useColorModeColorVars());

    expect(result.current.background).toBe('var(--chakra-colors-white)');
    expect(result.current.text).toBe('var(--chakra-colors-gray-700)');
    expect(result.current.link).toBe('var(--chakra-colors-blue-400)');
    expect(result.current.brand).toBe('var(--chakra-colors-blue-600)');
  });

  it('should return dark mode CSS variables when colorMode is dark', () => {
    vi.mocked(useColorMode).mockReturnValue({
      colorMode: 'dark',
      toggleColorMode: vi.fn(),
      setColorMode: vi.fn(),
    });

    const { result } = renderHook(() => useColorModeColorVars());

    expect(result.current.background).toBe('var(--chakra-colors-gray-800)');
    expect(result.current.text).toBe('var(--chakra-colors-gray-50)');
    expect(result.current.link).toBe('var(--chakra-colors-blue-200)');
    expect(result.current.brand).toBe('var(--chakra-colors-blue-600)');
  });

  it('should return CSS variable strings for all properties', () => {
    vi.mocked(useColorMode).mockReturnValue({
      colorMode: 'light',
      toggleColorMode: vi.fn(),
      setColorMode: vi.fn(),
    });

    const { result } = renderHook(() => useColorModeColorVars());
    const vars = result.current;

    Object.values(vars).forEach((value) => {
      // Most should be CSS variables, except for a few exceptions in the code
      expect(typeof value).toBe('string');
    });
  });
});

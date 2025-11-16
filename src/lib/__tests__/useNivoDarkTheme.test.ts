import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useNivoDarkTheme } from '../useNivoDarkTheme';

describe('useNivoDarkTheme', () => {
  it('should return a theme object', () => {
    const { result } = renderHook(() => useNivoDarkTheme());
    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe('object');
  });

  describe('theme structure', () => {
    it('should have background property', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current).toHaveProperty('background');
      expect(result.current.background).toBe('#1C1C1C');
    });

    it('should have text property with fill color', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current).toHaveProperty('text');
      expect(result.current.text).toHaveProperty('fill');
      expect(result.current.text.fill).toBe('#000000');
    });

    it('should have axis property with ticks configuration', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current).toHaveProperty('axis');
      expect(result.current.axis).toHaveProperty('ticks');
      expect(result.current.axis.ticks).toHaveProperty('text');
      expect(result.current.axis.ticks.text).toHaveProperty('fill');
      expect(result.current.axis.ticks.text.fill).toBe('#ffffff');
    });

    it('should have tooltip property with container configuration', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current).toHaveProperty('tooltip');
      expect(result.current.tooltip).toHaveProperty('container');
      expect(result.current.tooltip.container).toHaveProperty('background');
      expect(result.current.tooltip.container.background).toBe('#000000');
    });

    it('should have legends property with text configuration', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current).toHaveProperty('legends');
      expect(result.current.legends).toHaveProperty('text');
      expect(result.current.legends.text).toHaveProperty('fill');
      expect(result.current.legends.text.fill).toBe('#ffffff');
    });
  });

  describe('color values', () => {
    it('should use dark background color', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current.background).toBe('#1C1C1C');
    });

    it('should use black for text fill', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current.text.fill).toBe('#000000');
    });

    it('should use white for axis ticks text', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current.axis.ticks.text.fill).toBe('#ffffff');
    });

    it('should use black for tooltip background', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current.tooltip.container.background).toBe('#000000');
    });

    it('should use white for legends text', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      expect(result.current.legends.text.fill).toBe('#ffffff');
    });
  });

  describe('consistency', () => {
    it('should return the same object structure on multiple calls', () => {
      const { result, rerender } = renderHook(() => useNivoDarkTheme());
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      expect(secondResult).toEqual(firstResult);
    });

    it('should return a new object on each call', () => {
      const { result, rerender } = renderHook(() => useNivoDarkTheme());
      const firstResult = result.current;

      rerender();
      const secondResult = result.current;

      // Structure should be equal but not the same reference
      expect(secondResult).not.toBe(firstResult);
      expect(secondResult).toEqual(firstResult);
    });
  });

  describe('Nivo theme compatibility', () => {
    it('should have all required Nivo theme properties', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      const theme = result.current;

      // Check for standard Nivo theme structure
      expect(theme).toHaveProperty('background');
      expect(theme).toHaveProperty('text');
      expect(theme).toHaveProperty('axis');
      expect(theme).toHaveProperty('tooltip');
      expect(theme).toHaveProperty('legends');
    });

    it('should use valid CSS color values', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      const theme = result.current;

      const hexColorRegex = /^#[0-9A-Fa-f]{6}$/;

      expect(theme.background).toMatch(hexColorRegex);
      expect(theme.text.fill).toMatch(hexColorRegex);
      expect(theme.axis.ticks.text.fill).toMatch(hexColorRegex);
      expect(theme.tooltip.container.background).toMatch(hexColorRegex);
      expect(theme.legends.text.fill).toMatch(hexColorRegex);
    });
  });

  describe('edge cases', () => {
    it('should not throw when called multiple times', () => {
      expect(() => {
        renderHook(() => useNivoDarkTheme());
        renderHook(() => useNivoDarkTheme());
        renderHook(() => useNivoDarkTheme());
      }).not.toThrow();
    });

    it('should return a theme that can be spread into Nivo components', () => {
      const { result } = renderHook(() => useNivoDarkTheme());
      const theme = result.current;

      // Should be able to destructure without errors
      expect(() => {
        const { background, text, axis, tooltip, legends } = theme;
        expect(background).toBeDefined();
        expect(text).toBeDefined();
        expect(axis).toBeDefined();
        expect(tooltip).toBeDefined();
        expect(legends).toBeDefined();
      }).not.toThrow();
    });
  });
});

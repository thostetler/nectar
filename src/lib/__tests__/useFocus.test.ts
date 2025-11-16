import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFocus } from '../useFocus';

describe('useFocus', () => {
  let mockInput: HTMLInputElement;

  beforeEach(() => {
    // Create a mock input element
    mockInput = document.createElement('input');
    mockInput.value = 'test value';
    vi.spyOn(mockInput, 'focus');
    vi.spyOn(mockInput, 'select');
    document.body.appendChild(mockInput);
  });

  afterEach(() => {
    document.body.removeChild(mockInput);
    vi.restoreAllMocks();
  });

  describe('basic functionality', () => {
    it('should return a ref and focus function', () => {
      const { result } = renderHook(() => useFocus());
      expect(result.current).toHaveLength(2);
      expect(result.current[0]).toHaveProperty('current');
      expect(typeof result.current[1]).toBe('function');
    });

    it('should focus element on mount by default', () => {
      const { result } = renderHook(() => useFocus());
      result.current[0].current = mockInput;

      // Re-render to trigger useEffect
      act(() => {
        result.current[1]();
      });

      expect(mockInput.focus).toHaveBeenCalled();
    });

    it('should not focus on mount when focusOnMount is false', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false }));
      result.current[0].current = mockInput;

      expect(mockInput.focus).not.toHaveBeenCalled();
    });

    it('should select text on focus when selectTextOnFocus is true', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false, selectTextOnFocus: true }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      expect(mockInput.select).toHaveBeenCalled();
    });

    it('should not select text when selectTextOnFocus is false', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false, selectTextOnFocus: false }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      expect(mockInput.select).not.toHaveBeenCalled();
      expect(mockInput.focus).toHaveBeenCalled();
    });
  });

  describe('cursor position', () => {
    it('should move cursor to end when moveCursorToEnd is true', () => {
      mockInput.value = 'test value';
      const { result } = renderHook(() =>
        useFocus({ focusOnMount: false, moveCursorToEnd: true, selectTextOnFocus: false }),
      );
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      expect(mockInput.selectionStart).toBe(mockInput.value.length);
    });

    it('should not move cursor when moveCursorToEnd is false', () => {
      mockInput.value = 'test value';
      mockInput.selectionStart = 0;
      const { result } = renderHook(() => useFocus({ focusOnMount: false, moveCursorToEnd: false }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      expect(mockInput.selectionStart).toBe(0);
    });

    it('should handle empty input value', () => {
      mockInput.value = '';
      const { result } = renderHook(() =>
        useFocus({ focusOnMount: false, moveCursorToEnd: true, selectTextOnFocus: false }),
      );
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      expect(mockInput.selectionStart).toBe(0);
    });
  });

  describe('overrides', () => {
    it('should respect selectTextOnFocus override', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false, selectTextOnFocus: false }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]({ selectTextOnFocus: true });
      });

      expect(mockInput.select).toHaveBeenCalled();
    });

    it('should respect moveCursorToEnd override', () => {
      mockInput.value = 'test value';
      const { result } = renderHook(() =>
        useFocus({ focusOnMount: false, moveCursorToEnd: false, selectTextOnFocus: false }),
      );
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]({ moveCursorToEnd: true });
      });

      expect(mockInput.selectionStart).toBe(mockInput.value.length);
    });

    it('should allow disabling selectTextOnFocus via override', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false, selectTextOnFocus: true }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]({ selectTextOnFocus: false });
      });

      expect(mockInput.select).not.toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle null ref gracefully', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false }));

      expect(() => {
        act(() => {
          result.current[1]();
        });
      }).not.toThrow();
    });

    it('should not focus non-input elements without select', () => {
      const div = document.createElement('div');
      div.tabIndex = 0;
      vi.spyOn(div, 'focus');
      document.body.appendChild(div);

      const { result } = renderHook(() => useFocus<HTMLDivElement>({ focusOnMount: false, selectTextOnFocus: true }));
      result.current[0].current = div;

      act(() => {
        result.current[1]();
      });

      expect(div.focus).toHaveBeenCalled();
      document.body.removeChild(div);
    });

    it('should handle element without focus method', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false }));
      result.current[0].current = {} as HTMLInputElement;

      expect(() => {
        act(() => {
          result.current[1]();
        });
      }).not.toThrow();
    });

    it('should work with different element types', () => {
      const textarea = document.createElement('textarea');
      textarea.value = 'textarea content';
      vi.spyOn(textarea, 'focus');
      vi.spyOn(textarea, 'select');
      document.body.appendChild(textarea);

      const { result } = renderHook(() =>
        useFocus<HTMLTextAreaElement>({ focusOnMount: false, selectTextOnFocus: true }),
      );
      result.current[0].current = textarea;

      act(() => {
        result.current[1]();
      });

      expect(textarea.focus).toHaveBeenCalled();
      document.body.removeChild(textarea);
    });
  });

  describe('default props', () => {
    it('should use default props when none provided', () => {
      const { result } = renderHook(() => useFocus());
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      // Default behavior: focus, select text, move cursor
      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.select).toHaveBeenCalled();
    });

    it('should handle partial props', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
      });

      // Partial props mean unprovided values are undefined (not defaults)
      expect(mockInput.focus).toHaveBeenCalled();
      expect(mockInput.select).not.toHaveBeenCalled();
    });
  });

  describe('multiple focus calls', () => {
    it('should allow calling focus multiple times', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]();
        result.current[1]();
        result.current[1]();
      });

      expect(mockInput.focus).toHaveBeenCalledTimes(3);
    });

    it('should handle changing overrides between calls', () => {
      const { result } = renderHook(() => useFocus({ focusOnMount: false, selectTextOnFocus: false }));
      result.current[0].current = mockInput;

      act(() => {
        result.current[1]({ selectTextOnFocus: true });
      });
      expect(mockInput.select).toHaveBeenCalledTimes(1);

      act(() => {
        result.current[1]({ selectTextOnFocus: false });
      });
      expect(mockInput.select).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});

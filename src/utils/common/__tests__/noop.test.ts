import { describe, it, expect } from 'vitest';
import { noop } from '../noop';

describe('noop', () => {
  it('should be a function', () => {
    expect(typeof noop).toBe('function');
  });

  it('should return undefined', () => {
    const result = noop();
    expect(result).toBeUndefined();
  });

  it('should accept no arguments without error', () => {
    expect(() => noop()).not.toThrow();
  });

  it('should accept single argument without error', () => {
    expect(() => noop('test')).not.toThrow();
  });

  it('should accept multiple arguments without error', () => {
    expect(() => noop('arg1', 2, { key: 'value' }, [1, 2, 3])).not.toThrow();
  });

  it('should always return undefined regardless of arguments', () => {
    expect(noop('test')).toBeUndefined();
    expect(noop(1, 2, 3)).toBeUndefined();
    expect(noop({ key: 'value' })).toBeUndefined();
  });

  it('should work as a default callback', () => {
    const executeCallback = (callback = noop) => {
      callback('test');
    };
    expect(() => executeCallback()).not.toThrow();
  });

  it('should work in array methods', () => {
    const array = [1, 2, 3];
    expect(() => array.forEach(noop)).not.toThrow();
  });

  it('should work as event handler', () => {
    const button = { onClick: noop };
    expect(() => button.onClick()).not.toThrow();
  });

  it('should handle null and undefined arguments', () => {
    expect(() => noop(null, undefined)).not.toThrow();
    expect(noop(null, undefined)).toBeUndefined();
  });
});

// src/mocks/next-router.ts
import { NextRouter } from 'next/router';
import { vi } from 'vitest';

const listeners: { [key: string]: ((...args: unknown[]) => void)[] } = {};

const mockRouter: Partial<NextRouter> = {
  events: {
    on: vi.fn((event, callback: (...args: unknown[]) => void) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
    }),
    off: vi.fn((event, callback?: (...args: unknown[]) => void) => {
      if (listeners[event]) {
        if (callback) {
          listeners[event] = listeners[event].filter((cb) => cb !== callback);
        } else {
          delete listeners[event];
        }
      }
    }),
    emit: vi.fn((event, ...args: unknown[]) => {
      if (listeners[event]) {
        listeners[event].forEach((callback) => (callback as (...args: unknown[]) => void)(...args));
      }
    }),
  },
  push: vi.fn(),
  replace: vi.fn(),
  pathname: '/',
  query: {},
  asPath: '/',
  beforePopState: vi.fn(),
};

export { mockRouter };

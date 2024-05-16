import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defaultExclude, defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [...react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    exclude: [...defaultExclude, '**/e2e/**'],
    setupFiles: ['./vitest-setup.ts'],
    isolate: true,
    pool: 'forks',
    maxConcurrency: 16,
    globals: false,
    coverage: {
      provider: 'v8',
      reporter: 'lcov',
    },
  },
  cacheDir: '.vitest',
  resolve: {
    dedupe: [
      '@emotion/styled',
      '@emotion/react',
    ],
    mainFields: ['module', 'jsnext:main', 'main'],
    alias: {
      'react/jsx-dev-runtime.js': resolve(__dirname, 'node_modules/react/jsx-dev-runtime.js'),
      'react/jsx-runtime.js': resolve(__dirname, 'node_modules/react/jsx-runtime.js'),
    },
  },
});

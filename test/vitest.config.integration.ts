import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [],
  test: {
    root: path.resolve(import.meta.dirname, '../'),
    include: ['src/**/*.integration.test.ts'],
    globals: true,
    testTimeout: 30000,
    globalSetup: [path.resolve(import.meta.dirname, './global-setup-integration.ts')],
    setupFiles: [
      path.resolve(import.meta.dirname, './setup-vitest.ts'),
      path.resolve(import.meta.dirname, './setup-integration.ts'),
    ],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    isolate: false,
  },
});

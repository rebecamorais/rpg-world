import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [],
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.integration.test.ts'],
    globals: true,
    testTimeout: 30000,
    globalSetup: [path.resolve(__dirname, './global-setup-integration.ts')],
    setupFiles: [
      path.resolve(__dirname, './setup-vitest.ts'),
      path.resolve(__dirname, './setup-integration.ts'),
    ],
    pool: 'threads',
    fileParallelism: false,
    maxWorkers: 1,
    isolate: false,
  },
});

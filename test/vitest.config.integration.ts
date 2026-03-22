import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

import { setupTestEnvironment } from './setup-env';

setupTestEnvironment();

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.integration.test.ts'],
    globals: true,
    testTimeout: 30000,
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

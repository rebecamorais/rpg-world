import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// 1. Importe o plugin

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
  },
});

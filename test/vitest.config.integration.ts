import path from 'path';
import { defineConfig } from 'vitest/config';

import { setupTestEnvironment } from './setup-env';

setupTestEnvironment();

export default defineConfig({
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.integration.test.ts'],
    globals: true,
    testTimeout: 30000,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
});

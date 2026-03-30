import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [],
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.unit.test.ts'],
    environment: 'node',
    globals: true,
  },
});

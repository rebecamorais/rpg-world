import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.unit.test.ts'],
    environment: 'node',
    globals: true,
  },
});

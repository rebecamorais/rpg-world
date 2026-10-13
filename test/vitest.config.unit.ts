import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [],
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.unit.test.ts', 'shared/**/*.unit.test.ts'],
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['app/**', 'src/**', 'shared/**', 'lib/**', 'proxy.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', 'lib/types/**'],
      reporter: ['text-summary', 'html'],
    },
  },
});

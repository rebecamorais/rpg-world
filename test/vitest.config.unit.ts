import path from 'path';
import { defineConfig } from 'vitest/config';

const root = path.resolve(__dirname, '../');

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [],
  test: {
    root,
    globals: true,
    coverage: {
      provider: 'v8',
      include: ['app/**', 'src/**', 'shared/**', 'lib/**', 'proxy.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', 'lib/types/**'],
      reporter: ['text-summary', 'html'],
    },
    // `.ts` tests run in Node; `.tsx` tests (hooks, contexts, components) run in jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['{app,src,shared}/**/*.unit.test.ts'],
          environment: 'node',
          setupFiles: [path.resolve(__dirname, './setup-unit.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          include: ['src/**/*.unit.test.tsx'],
          environment: 'jsdom',
          setupFiles: [path.resolve(__dirname, './setup-dom.ts')],
        },
      },
    ],
  },
});

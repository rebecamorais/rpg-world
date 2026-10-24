import path from 'path';
import { defineConfig } from 'vitest/config';

const root = path.resolve(import.meta.dirname, '../');

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [],
  test: {
    root,
    globals: true,
    // next-intl's ESM imports `next/server` without an extension, which only a bundler resolves
    server: { deps: { inline: ['next-intl'] } },
    coverage: {
      provider: 'v8',
      include: ['app/**', 'src/**', 'shared/**', 'lib/**', 'proxy.ts'],
      exclude: ['**/*.test.{ts,tsx}', '**/*.d.ts', 'lib/types/**'],
      reporter: ['text-summary', 'html'],
      // Floor a little under the current numbers: CI fails if coverage drops. Raise it as it grows.
      thresholds: { lines: 57, statements: 57, functions: 52, branches: 49 },
    },
    // `.ts` tests run in Node; `.tsx` tests (hooks, contexts, components) run in jsdom.
    projects: [
      {
        extends: true,
        test: {
          name: 'node',
          include: ['{app,src,shared,content,scripts}/**/*.unit.test.ts', '*.unit.test.ts'],
          environment: 'node',
          setupFiles: [path.resolve(import.meta.dirname, './setup-unit.ts')],
        },
      },
      {
        extends: true,
        test: {
          name: 'dom',
          include: ['{app,src}/**/*.unit.test.tsx'],
          environment: 'jsdom',
          setupFiles: [path.resolve(import.meta.dirname, './setup-dom.ts')],
        },
      },
    ],
  },
});

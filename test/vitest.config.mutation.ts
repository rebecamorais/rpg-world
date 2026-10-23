import { defineConfig } from 'vitest/config';

// Used by Stryker (stryker.config.mjs): only the Node unit tests that exercise the mutated code
// (domain, use cases, D&D rules); Stryker's runner doesn't handle the node/dom projects split.
// Paths are relative to the working directory on purpose: Stryker runs from a sandbox copy, and
// a root derived from import.meta.dirname would point back at the real (unmutated) sources.
export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    include: ['src/backend/**/*.unit.test.ts', 'shared/**/*.unit.test.ts'],
    environment: 'node',
    globals: true,
    setupFiles: ['./test/setup-unit.ts'],
  },
});

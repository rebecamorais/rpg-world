// Mutation testing (npm run test:mutation): Stryker changes the code on purpose (flips
// conditions, removes calls...) and checks that some test fails. Coverage only shows that a
// line ran; a surviving mutant shows an assertion that is missing. Slow, so it runs on demand.
/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  // The vitest runner doesn't activate mutants under Vitest 5 (every mutant "survives"), so each
  // mutant reruns the Node unit tests through the command runner: slower, but correct
  testRunner: 'command',
  commandRunner: { command: 'npx vitest run --config test/vitest.config.mutation.ts' },
  coverageAnalysis: 'off',
  // The rules of the game: domain, use cases and the D&D calculations
  mutate: [
    'src/backend/contexts/*/domain/**/*.ts',
    'src/backend/contexts/*/application/**/*.ts',
    'shared/systems/dnd5e/calculations.ts',
    '!**/*.test.ts',
    '!**/*Repository.ts',
  ],
  reporters: ['clear-text', 'progress', 'html'],
  htmlReporter: { fileName: 'reports/mutation/index.html' },
  tempDirName: '.stryker-tmp',
  // Keep the sandbox copy small: builds, local tooling and the database stacks aren't needed
  ignorePatterns: [
    '.codegraph',
    '.next',
    '.next-e2e',
    'database',
    'coverage',
    'reports',
    'playwright-report',
    'test-results',
    'e2e',
  ],
  concurrency: 4,
  thresholds: { high: 80, low: 60, break: null },
};

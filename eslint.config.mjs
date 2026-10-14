import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import prettierConfig from 'eslint-config-prettier';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  prettierConfig,

  {
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      'react/self-closing-comp': 'error',
    },
  },

  {
    // Playwright fixtures receive a `use` callback that is not React's `use` hook
    files: ['e2e/**'],
    rules: { 'react-hooks/rules-of-hooks': 'off' },
  },

  globalIgnores([
    '.next/**',
    '.next-e2e/**',
    'playwright-report/**',
    'test-results/**',
    'reports/**',
    '.stryker-tmp/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'node_modules/**',
    'public/**',
  ]),
]);

export default eslintConfig;

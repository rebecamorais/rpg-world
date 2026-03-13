import path from 'path';
import tsconfigPaths from 'vite-tsconfig-paths';
import { defineConfig } from 'vitest/config';

// 1. Importante para ler o tsconfig.json

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.unit.test.ts'],
    environment: 'node',
    globals: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://mock-url.com',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'mock-key',
    },
  },
});

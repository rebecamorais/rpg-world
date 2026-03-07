import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: path.resolve(__dirname, '../'),
    include: ['src/**/*.unit.test.ts'],
    environment: 'node',
    globals: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: 'http://mock-url.com',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: 'mock-key',
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../src'),
    },
  },
});

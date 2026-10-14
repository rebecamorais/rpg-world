import { execSync } from 'child_process';

export const E2E_PORT = 3100;
export const BASE_URL = `http://localhost:${E2E_PORT}`;

// Cloudflare's documented test keys: the widget always passes, without a real challenge
const TURNSTILE_TEST_SITE_KEY = '1x00000000000000000000AA';
const TURNSTILE_TEST_SECRET_KEY = '1x0000000000000000000000000000000AA';

export interface SupabaseTestEnv {
  url: string;
  publishableKey: string;
  secretKey: string;
  /** Mailpit (Inbucket) web API, where the app's e-mails land */
  mailUrl: string;
}

let cached: SupabaseTestEnv | undefined;

/** Keys of the local test stack (`database/db-test`), the same one the integration tests use. */
export function supabaseTestEnv(): SupabaseTestEnv {
  if (!cached) {
    const status = JSON.parse(
      execSync('npx supabase status -o json --workdir database/db-test', {
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'ignore'],
      }),
    );
    cached = {
      url: status.API_URL,
      publishableKey: status.ANON_KEY,
      secretKey: status.SERVICE_ROLE_KEY,
      mailUrl: status.MAILPIT_URL ?? status.INBUCKET_URL,
    };
  }
  return cached;
}

/** Environment for `next build` / `next start` (NEXT_PUBLIC_* are inlined at build time). */
export function appEnv(): Record<string, string> {
  const supabase = supabaseTestEnv();
  return {
    NEXT_DIST_DIR: '.next-e2e',
    NEXT_PUBLIC_SITE_URL: BASE_URL,
    NEXT_PUBLIC_SUPABASE_URL: supabase.url,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: supabase.publishableKey,
    SUPABASE_SECRET_KEY: supabase.secretKey,
    NEXT_PUBLIC_TURNSTILE_SITE_KEY: TURNSTILE_TEST_SITE_KEY,
    TURNSTILE_SECRET_KEY: TURNSTILE_TEST_SECRET_KEY,
    // Never send real e-mails from a test run: they go to the test stack's Inbucket instead
    RESEND_API_KEY: '',
    LOCAL_SMTP_PORT: '54425',
    // Avatars are served by this build, not by the production image host
    ASSET_BASE_URL: `${BASE_URL}/api/images`,
  };
}

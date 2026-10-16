/**
 * Public origin of this deployment, used to build links that leave the app (e-mails).
 *
 * Preview deployments serve every pull request on its own branch URL and talk to the staging
 * Supabase, so their links must come back to that preview, never to production.
 */
export function siteUrl(): string {
  if (process.env.VERCEL_ENV === 'preview' && process.env.VERCEL_BRANCH_URL) {
    return `https://${process.env.VERCEL_BRANCH_URL}`;
  }

  return (process.env.NEXT_PUBLIC_SITE_URL ?? '').replace(/\/+$/, '');
}

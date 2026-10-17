/**
 * Canonical public addresses. SEO metadata, the sitemap and structured data always name
 * production, even when rendered by a preview or locally, so they're fixed here rather than
 * read from the environment (links that must return to the current deployment use `siteUrl()`).
 */
export const SITE_URL = 'https://rpgworldapp.com';

export const GITHUB_REPO = 'https://github.com/rebecamorais/rpg-world';

/**
 * Canonical public addresses. SEO metadata, the sitemap and structured data always name
 * production, even when rendered by a preview or locally, so they're fixed here rather than
 * read from the environment (links that must return to the current deployment use `siteUrl()`).
 */
export const SITE_URL = 'https://rpgworldapp.com';

export const GITHUB_REPO = 'https://github.com/rebecamorais/rpg-world';

/** Invite to the community server, which is also the support and privacy contact. */
export const DISCORD_INVITE = 'https://discord.gg/7u6guShqhQ';

/** Community translations of the interface and the rules content. */
export const CROWDIN_PROJECT = 'https://crowdin.com/project/rpgworld';

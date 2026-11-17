/**
 * The Grimoire lab (/dev/grimoire/*) is an internal tool. It exists in development, and in a
 * production build only when GRIMOIRE_LAB=1 is set on purpose (the local benchmark does that).
 * Vercel never sets it, so the deployed site answers 404.
 */
export function isGrimoireLabEnabled(env: Record<string, string | undefined> = process.env) {
  return env.NODE_ENV !== 'production' || env.GRIMOIRE_LAB === '1';
}

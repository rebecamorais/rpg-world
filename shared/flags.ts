import { globalConfigAdapter } from '@flags-sdk/global-config';
import { flag } from 'flags/next';

/**
 * Maintenance mode: while it is on, every page shows the maintenance screen with a 503 (see
 * proxy.ts). Switched in the `flags` item of the project's Vercel Global Config (formerly Edge
 * Config) as `{ "maintenance": true }`, with no deploy, so it keeps working while the database is
 * down.
 *
 * Off when it can't be read (no store in dev, CI and tests; the item or key missing; the store
 * unreachable): a flag that fails must never take the site down. Connecting the store creates
 * GLOBAL_CONFIG (EDGE_CONFIG on stores connected before the rename, which the adapter also reads).
 * The adapter is only built when one of them exists, since it throws without it.
 */
export const maintenanceFlag = flag<boolean>({
  key: 'maintenance',
  description: 'Shows the maintenance screen on every page',
  defaultValue: false,
  ...(process.env.GLOBAL_CONFIG || process.env.EDGE_CONFIG
    ? { adapter: globalConfigAdapter }
    : { decide: () => false }),
});

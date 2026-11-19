import { edgeConfigAdapter } from '@flags-sdk/edge-config';
import { flag } from 'flags/next';

/**
 * Maintenance mode: while it is on, every page shows the maintenance screen with a 503 (see
 * proxy.ts). Switched in the `flags` item of the project's Vercel Edge Config
 * (`{ "maintenance": true }`), with no deploy, so it keeps working while the database is down.
 *
 * Off when it can't be read (no Edge Config in dev, CI and tests; the item or key missing; Edge
 * Config unreachable): a flag that fails must never take the site down. The adapter is only built
 * when EDGE_CONFIG exists, since it throws without it.
 */
export const maintenanceFlag = flag<boolean>({
  key: 'maintenance',
  description: 'Shows the maintenance screen on every page',
  defaultValue: false,
  ...(process.env.EDGE_CONFIG ? { adapter: edgeConfigAdapter } : { decide: () => false }),
});

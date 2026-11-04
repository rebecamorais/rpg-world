import { APIError } from '@frontend/lib/api-client/apiClient';
import type { ApiTransport } from '@frontend/lib/api-client/apiClient';

import { DEMO_PARTY_ID } from './ids';
import type { DemoData } from './types';

const PARTY = `/api/parties/${DEMO_PARTY_ID}`;
const SHEET = new RegExp(`^${PARTY}/characters/([^/]+)(?:/(lore|spells|inventory))?$`);

const notFound = () => new APIError('Not found', 404);

function read(data: DemoData, path: string, query: URLSearchParams): unknown {
  if (path === '/api/parties') return data.parties;
  if (path === PARTY) return data.party;
  if (path === `${PARTY}/encounter`) return {};
  if (path === `${PARTY}/chest`) return data.chest;
  if (path === `${PARTY}/characters`) {
    if (query.get('kind') === 'npc') return data.npcs;
    throw notFound();
  }
  if (['/api/items', '/api/conditions', '/api/spells'].includes(path)) return [];

  const sheet = SHEET.exec(path);
  if (!sheet) throw notFound();
  const [, id, part] = sheet;
  const found =
    part === 'lore'
      ? data.lore[id]
      : part === 'spells'
        ? data.spells[id]
        : part === 'inventory'
          ? data.inventories[id]
          : data.characters[id];
  if (found === undefined) throw notFound();
  return found;
}

/** Serves the demo's reads from memory. Writes are refused; the session check goes to the network. */
export function createDemoTransport(data: DemoData, onBlockedWrite: () => void): ApiTransport {
  return (method, url) => {
    if (method !== 'GET') {
      onBlockedWrite();
      return Promise.reject(new APIError('demo_read_only', 403));
    }
    const { pathname, searchParams } = new URL(url, 'http://demo.local');
    if (pathname === '/api/auth/session') return undefined;
    try {
      return Promise.resolve(read(data, pathname, searchParams));
    } catch (error) {
      return Promise.reject(error);
    }
  };
}

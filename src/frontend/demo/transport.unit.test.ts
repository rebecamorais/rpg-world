import { describe, expect, it, vi } from 'vitest';

import { DEMO_PARTY_ID } from './ids';
import { createDemoTransport } from './transport';
import type { DemoData } from './types';

const data = {
  party: { id: DEMO_PARTY_ID },
  parties: { asGm: [] },
  characters: { ada: { id: 'ada' } },
  lore: { ada: { backstory: 'x' } },
  spells: { ada: [{ key: 's' }] },
  inventories: { ada: { items: [] } },
  chest: { items: [] },
  npcs: [{ id: 'joan' }],
  inspirations: {},
} as unknown as DemoData;

describe('createDemoTransport', () => {
  const blocked = vi.fn();
  const t = createDemoTransport(data, blocked);
  const sheet = `/api/parties/${DEMO_PARTY_ID}/characters/ada`;

  it('serves the catalog reads', async () => {
    await expect(t('GET', '/api/parties')).resolves.toEqual(data.parties);
    await expect(t('GET', `/api/parties/${DEMO_PARTY_ID}`)).resolves.toEqual(data.party);
    await expect(t('GET', `/api/parties/${DEMO_PARTY_ID}/encounter`)).resolves.toEqual({});
    await expect(t('GET', `/api/parties/${DEMO_PARTY_ID}/chest`)).resolves.toEqual(data.chest);
    await expect(t('GET', `/api/parties/${DEMO_PARTY_ID}/characters?kind=npc`)).resolves.toEqual(
      data.npcs,
    );
    await expect(t('GET', '/api/characters?kind=npc')).resolves.toEqual(data.npcs);
    await expect(t('GET', `${sheet}?x=1`)).resolves.toEqual(data.characters.ada);
    await expect(t('GET', `${sheet}/lore`)).resolves.toEqual(data.lore.ada);
    await expect(t('GET', `${sheet}/spells`)).resolves.toEqual(data.spells.ada);
    await expect(t('GET', `${sheet}/inventory`)).resolves.toEqual(data.inventories.ada);
    await expect(t('GET', '/api/spells?level=1')).resolves.toEqual([]);
    await expect(t('GET', '/api/items')).resolves.toEqual([]);
    await expect(t('GET', '/api/conditions')).resolves.toEqual([]);
  });

  it('leaves the session check to the network', () => {
    expect(t('GET', '/api/auth/session')).toBeUndefined();
  });

  it('answers 404 to anything else', async () => {
    await expect(t('GET', '/api/qualquer-coisa')).rejects.toMatchObject({ status: 404 });
    await expect(t('GET', `${sheet.replace('ada', 'nobody')}`)).rejects.toMatchObject({
      status: 404,
    });
  });

  it('refuses writes and tells the caller', async () => {
    await expect(t('POST', '/api/auth/signout')).rejects.toMatchObject({
      status: 403,
      message: 'demo_read_only',
    });
    expect(blocked).toHaveBeenCalledTimes(1);
  });
});

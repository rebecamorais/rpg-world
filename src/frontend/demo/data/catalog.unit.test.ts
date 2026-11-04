import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import { getItemCatalog } from '@backend/contexts/items';
import { getSpellCatalog } from '@backend/contexts/spells';

import { buildDemoData, resolveDemoSpells } from './build';

describe('demo catalog', () => {
  it.each(['en', 'pt'] as const)('catálogo %s', (locale) => {
    const data = buildDemoData(locale);
    expect(Object.keys(data.characters)).toHaveLength(13);
    expect(data.party.roster).toHaveLength(6);
    expect(data.npcs).toHaveLength(7);
    expect(data.party.role).toBe('gm');
    expect(data.party.hasGm).toBe(true);
    // fotos existem em public/, e o nome real não vaza fora de inspirations
    for (const c of Object.values(data.characters)) {
      expect(existsSync(`public${c.avatarUrl}`)).toBe(true);
      expect(c.ownerUsername).toBe('the_pioneers');
      expect(c.level).toBeGreaterThanOrEqual(3);
      expect(c.level).toBeLessThanOrEqual(5);
    }
    const fiction = JSON.stringify({ ...data, inspirations: undefined });
    expect(fiction).not.toMatch(/Perlman|Radia|Margaret/);
    expect(Object.keys(data.inspirations)).toHaveLength(13);
  });

  it('toda magia e item existe em content/', async () => {
    const data = buildDemoData('en');
    const allSpells = Object.values(data.spells as Record<string, string[]>).flat();
    expect((await getSpellCatalog().findByKeys(allSpells)).length).toBe(allSpells.length);
    const refs = [...Object.values(data.inventories), data.chest].flatMap((inv) =>
      inv.items.map((item) => item.ref),
    );
    expect(refs.every((ref) => getItemCatalog().find(ref))).toBe(true);
    expect(Object.values(await resolveDemoSpells(data, 'pt'))).toHaveLength(13);
  });

  it('ideals, bonds e flaws nunca ficam vazios', () => {
    for (const c of Object.values(buildDemoData('en').characters)) {
      expect(c.ideals).toBeTruthy();
      expect(c.bonds).toBeTruthy();
      expect(c.flaws).toBeTruthy();
    }
  });

  it('o lore pt é diferente do en', () => {
    const en = buildDemoData('en');
    const pt = buildDemoData('pt');
    for (const slug of Object.keys(en.lore)) {
      expect(pt.lore[slug].backstory).not.toBe(en.lore[slug].backstory);
    }
  });
});

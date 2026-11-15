import { describe, expect, it } from 'vitest';

import { hitDiceRemaining, readHitDice } from '@shared/systems/dnd5e/hit-dice';

import { SupabaseFactory } from '@lib/supabase';

import { runMigrationRolledBack } from '../../../../../../test/helpers/migration';
import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';

// A migração grava d8 nas fichas que já existem e não têm dado de vida reconhecido: é o que elas
// mostravam, e sem isso passariam a mostrar o dado da classe. Roda de verdade sobre fichas
// preparadas, dentro de uma transação desfeita.
const LEVEL = 5;

describe('migração do dado de vida (Integration)', () => {
  it('grava d8 só onde falta dado, sem mudar os dados restantes', async () => {
    const { userId } = await createSignedInClient('owner');
    const admin = SupabaseFactory.createAdmin();
    const sheets: { name: string; system?: string; hitDice?: unknown }[] = [
      { name: 'a-sem-campo' },
      { name: 'b-null', hitDice: null },
      { name: 'c-so-gastos', hitDice: { spent: 2 } },
      { name: 'd-dado-null', hitDice: { die: null, spent: 3 } },
      { name: 'e-dado-invalido', hitDice: { die: 'd20', spent: 1 } },
      { name: 'f-antigo-sem-dado', hitDice: { total: '', current: 3 } },
      { name: 'g-antigo-acima-do-nivel', hitDice: { total: 'x', current: 9 } },
      // Com dado reconhecido: não podem mudar
      { name: 'h-atual-d12', hitDice: { die: 'd12', spent: 4 } },
      { name: 'i-atual-d8', hitDice: { die: 'd8', spent: 0 } },
      { name: 'j-antigo-5d10', hitDice: { total: '5d10', current: 2 } },
      { name: 'k-antigo-1d6', hitDice: { total: '1d6', current: 5 } },
      { name: 'l-outro-sistema', system: 'ezd6' },
    ];
    const { error } = await admin.from('characters').insert(
      sheets.map(({ name, system = 'dnd_5e', ...rest }) => ({
        name,
        system,
        level: LEVEL,
        owner_id: userId,
        system_data: 'hitDice' in rest ? { ac: 12, hitDice: rest.hitDice } : { ac: 12 },
      })) as never,
    );
    expect(error).toBeNull();

    const { values, revisionBumps, once, twice } = runMigrationRolledBack<never>(
      '20261115210000_hit_die_legacy_d8.sql',
      userId,
      `system_data -> 'hitDice'`,
    );

    expect(values).toEqual({
      'a-sem-campo': { die: 'd8', spent: 0 },
      'b-null': { die: 'd8', spent: 0 },
      'c-so-gastos': { die: 'd8', spent: 2 },
      'd-dado-null': { die: 'd8', spent: 3 },
      'e-dado-invalido': { die: 'd8', spent: 1 },
      // Formato antigo: 3 restantes no nível 5 são 2 gastos
      'f-antigo-sem-dado': { die: 'd8', spent: 2 },
      'g-antigo-acima-do-nivel': { die: 'd8', spent: 0 },
      'h-atual-d12': { die: 'd12', spent: 4 },
      'i-atual-d8': { die: 'd8', spent: 0 },
      'j-antigo-5d10': { total: '5d10', current: 2 },
      'k-antigo-1d6': { total: '1d6', current: 5 },
      'l-outro-sistema': null,
    });

    // O que a ficha mostrava antes é o que mostra depois: d8 onde não havia dado, e os mesmos
    // dados restantes em todas
    for (const sheet of sheets.filter((s) => s.system === undefined)) {
      const before = (sheet.hitDice ?? undefined) as never;
      const after = values[sheet.name];
      expect(readHitDice(after, LEVEL).die, sheet.name).toBe(
        readHitDice(before, LEVEL).die ?? 'd8',
      );
      expect(hitDiceRemaining(after, LEVEL), sheet.name).toBe(hitDiceRemaining(before, LEVEL));
    }

    const changed = sheets.slice(0, 7).map((sheet) => [sheet.name, 1]);
    const untouched = sheets.slice(7).map((sheet) => [sheet.name, 0]);
    expect(revisionBumps).toEqual(Object.fromEntries([...changed, ...untouched]));
    // Rodar de novo: nem valor nem revisão mudam
    expect(twice).toEqual(once);
  });
});

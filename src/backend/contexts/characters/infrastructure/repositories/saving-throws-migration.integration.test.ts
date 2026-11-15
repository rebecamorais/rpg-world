import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { SupabaseFactory } from '@lib/supabase';

import { createSignedInClient } from '../../../../../../test/helpers/signed-in-client';

// A migração das salvaguardas roda uma vez, em produção, sobre as fichas de todo mundo. Aqui ela
// roda de verdade sobre fichas preparadas, dentro de uma transação que é desfeita no fim, para
// não mexer nas fichas dos outros testes.
const MIGRATION = readFileSync(
  join(process.cwd(), 'database/migrations/20261115200000_saving_throws_explicit.sql'),
  'utf8',
);
const SIX = { STR: false, DEX: false, CON: false, INT: false, WIS: false, CHA: false };

type Row = { name: string; saves: unknown; revision: number };

/** The prepared sheets as they are before, after one run and after a second run. */
function runMigration(ownerId: string): { before: Row[]; once: Row[]; twice: Row[] } {
  const snapshot = (label: string) => `
    SELECT '${label}' || coalesce(json_agg(json_build_object(
      'name', name, 'saves', system_data -> 'savingThrowProficiencies', 'revision', revision
    ) ORDER BY name), '[]')
    FROM public.characters WHERE owner_id = '${ownerId}';`;
  const sql = `BEGIN;\n${snapshot('before=')}\n${MIGRATION}\n${snapshot('once=')}\n${MIGRATION}\n${snapshot('twice=')}\nROLLBACK;`;
  const output = execFileSync(
    'docker',
    ['exec', '-i', 'supabase_db_rpg-world-test', 'psql', '-U', 'postgres', '-d', 'postgres'].concat(
      ['-At', '-v', 'ON_ERROR_STOP=1'],
    ),
    { input: sql, encoding: 'utf8' },
  );
  const read = (label: string) =>
    JSON.parse(
      output
        .split('\n')
        .find((line) => line.startsWith(label))!
        .slice(label.length),
    );
  return { before: read('before='), once: read('once='), twice: read('twice=') };
}

describe('migração das salvaguardas (Integration)', () => {
  it('completa só o que falta, só em D&D 5e, e rodar de novo não muda nada', async () => {
    const { userId } = await createSignedInClient('owner');
    const admin = SupabaseFactory.createAdmin();
    const complete = { STR: true, DEX: false, CON: true, INT: false, WIS: false, CHA: true };
    const sheets: { name: string; system?: string; system_data: Record<string, unknown> }[] = [
      { name: 'a-sem-campo', system_data: { ac: 12 } },
      { name: 'b-parcial', system_data: { savingThrowProficiencies: { DEX: true } } },
      { name: 'c-null', system_data: { savingThrowProficiencies: { ...complete, CON: null } } },
      { name: 'd-campo-null', system_data: { savingThrowProficiencies: null } },
      { name: 'e-texto', system_data: { savingThrowProficiencies: { ...complete, STR: 'sim' } } },
      { name: 'f-completa', system_data: { ac: 15, savingThrowProficiencies: complete } },
      { name: 'g-outro-sistema', system: 'ezd6', system_data: { ac: 9 } },
    ];
    const { error } = await admin
      .from('characters')
      .insert(sheets.map((sheet) => ({ system: 'dnd_5e', ...sheet, owner_id: userId })) as never);
    expect(error).toBeNull();

    const { before, once, twice } = runMigration(userId);
    const saves = (rows: Row[]) => Object.fromEntries(rows.map((row) => [row.name, row.saves]));

    expect(saves(once)).toEqual({
      'a-sem-campo': SIX,
      'b-parcial': { ...SIX, DEX: true },
      // O que já era booleano fica; só o null vira "não proficiente"
      'c-null': { ...complete, CON: false },
      'd-campo-null': SIX,
      'e-texto': { ...complete, STR: false },
      'f-completa': complete,
      // Outro sistema não ganha o campo
      'g-outro-sistema': null,
    });

    // A revisão sobe 1 nas alteradas e fica igual nas outras
    const bump = (rows: Row[]) =>
      Object.fromEntries(rows.map((row, i) => [row.name, row.revision - before[i].revision]));
    expect(bump(once)).toEqual({
      'a-sem-campo': 1,
      'b-parcial': 1,
      'c-null': 1,
      'd-campo-null': 1,
      'e-texto': 1,
      'f-completa': 0,
      'g-outro-sistema': 0,
    });

    // Rodar de novo: nem valor nem revisão mudam
    expect(twice).toEqual(once);
  });
});

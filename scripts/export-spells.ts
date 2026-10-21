/**
 * One-off: writes the spells stored in the database (spells + spell_translations) to the content
 * files in content/dnd5e/srd-5.1, so moving them out of the database changes no text.
 * Replaced by the 5etools importer in the next step (docs/plans/2026-10-21-magias-em-arquivo.md).
 *
 *   SUPABASE_URL=… SUPABASE_SECRET_KEY=… npx tsx scripts/export-spells.ts
 *
 * (URL and secret key of the local dev stack: `npx supabase status --workdir database/db-dev`.)
 */
import { createClient } from '@supabase/supabase-js';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

import {
  type SpellData,
  type SpellText,
  spellDataSchema,
  spellTextSchema,
} from '../shared/systems/dnd5e/content/spell.schema';

const OUT_DIR = 'content/dnd5e/srd-5.1';
const LOCALES = ['en', 'pt'];

async function main() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) throw new Error('Set SUPABASE_URL and SUPABASE_SECRET_KEY');
  const db = createClient(url, key, { auth: { persistSession: false } });

  const { data: rows, error } = await db
    .from('spells')
    .select('*, spell_translations(locale, name, description, higher_level, material)')
    .order('external_index');
  if (error) throw error;

  const spells: SpellData[] = [];
  const texts: Record<string, Record<string, SpellText>> = Object.fromEntries(
    LOCALES.map((locale) => [locale, {}]),
  );

  for (const row of rows) {
    const id = row.external_index as string;
    spells.push(
      spellDataSchema.parse({
        id,
        level: row.level,
        school: row.school,
        classes: row.classes ?? [],
        components: row.components ?? [],
        castingTime: row.casting_time,
        castingValue: row.casting_value,
        rangeUnit: row.range_unit,
        rangeValue: row.range_value,
        durationUnit: row.duration_unit,
        durationValue: row.duration_value,
        concentration: row.concentration ?? false,
        ritual: row.ritual ?? false,
        isScaling: row.is_scaling ?? false,
        materialCost: row.material_cost ?? 0,
        damageType: row.damage_type || null,
        spellCategory: row.spell_category || null,
        bgStyleId: row.bg_style_id || null,
      }),
    );
    for (const t of row.spell_translations) {
      texts[t.locale][id] = spellTextSchema.parse({
        name: t.name,
        description: t.description,
        higherLevel: t.higher_level || null,
        material: t.material || null,
      });
    }
  }

  const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;
  await mkdir(OUT_DIR, { recursive: true });
  await writeFile(path.join(OUT_DIR, 'spells.json'), json(spells));
  for (const locale of LOCALES) {
    const sorted = Object.fromEntries(
      Object.entries(texts[locale]).sort(([a], [b]) => a.localeCompare(b)),
    );
    await mkdir(path.join(OUT_DIR, 'i18n', locale), { recursive: true });
    await writeFile(path.join(OUT_DIR, 'i18n', locale, 'spells.json'), json(sorted));
    console.log(`${locale}: ${Object.keys(sorted).length} texts`);
  }
  console.log(`${spells.length} spells`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

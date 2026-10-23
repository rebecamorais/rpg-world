/**
 * Imports the SRD 5.2 spells from 5etools into content/dnd5e/srd-5.2/, and completes the SRD 5.1
 * ones (content/dnd5e/srd-5.1/) with what their first source lacked.
 *
 *   npm run content:spells
 *
 * Only entries 5etools marks as SRD (`srd52`, `srd`). For 5.2, rewrites the rules data and the
 * English texts; for 5.1, only the other casting times and the reaction's trigger. Translations
 * (i18n/<locale>/) come from Crowdin and are never touched, apart from creating an empty file for
 * Portuguese the first time.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import {
  type SpellData,
  type SpellText,
  spellDataSchema,
  spellTextSchema,
} from '@shared/systems/dnd5e/content/spell.schema';

import { writeFormatted } from '../write-formatted';
import {
  type FiveToolsSpell,
  extrasOf,
  toSpellData,
  toSpellId,
  toSpellText,
} from './5etools-spells';

const VERSION = 'v2.38.0';
const BASE = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/${VERSION}/data`;

const ROOT = path.join(import.meta.dirname, '../../content/dnd5e');
const OUT = path.join(ROOT, 'srd-5.2');

type ClassLookup = Record<string, Record<string, { class?: Record<string, Record<string, true>> }>>;

async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`${BASE}/${file}`);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

const write = (file: string, data: unknown) => writeFormatted(file, JSON.stringify(data));

const readJson = (file: string): unknown => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'));

/** Adds the fields 5etools has and the 5.1 files lack, leaving every other field as it is. */
async function complete51(phb: FiveToolsSpell[], srd51: SpellData[]) {
  const texts = z
    .record(z.string(), spellTextSchema)
    .parse(readJson('srd-5.1/i18n/en/spells.json'));
  const extras = new Map(phb.filter((s) => s.srd).map((s) => [toSpellId(s), extrasOf(s)]));

  const spells = srd51.map(({ extraCastingTimes: _, ...data }) => {
    const { extraCastingTimes } = extras.get(data.id) ?? {};
    if (!extraCastingTimes) return data;
    // In the schema's order, next to the first casting time
    const { castingValue, ...rest } = data;
    const [before, after] = [
      Object.fromEntries(Object.entries(rest).slice(0, Object.keys(data).indexOf('castingValue'))),
      Object.fromEntries(Object.entries(rest).slice(Object.keys(data).indexOf('castingValue'))),
    ];
    return { ...before, castingValue, extraCastingTimes, ...after } as SpellData;
  });
  const completed = Object.fromEntries(
    Object.entries(texts).map(([id, { trigger: _, ...text }]): [string, SpellText] => {
      const { trigger } = extras.get(id) ?? {};
      return [id, trigger ? { ...text, trigger } : text];
    }),
  );

  await write(path.join(ROOT, 'srd-5.1/spells.json'), z.array(spellDataSchema).parse(spells));
  await write(path.join(ROOT, 'srd-5.1/i18n/en/spells.json'), completed);
}

async function main() {
  const { spell } = await fetchJson<{ spell: FiveToolsSpell[] }>('spells/spells-xphb.json');
  const { spell: phb } = await fetchJson<{ spell: FiveToolsSpell[] }>('spells/spells-phb.json');
  const lookup = await fetchJson<ClassLookup>('generated/gendata-spell-source-lookup.json');

  const srd51 = z.array(spellDataSchema).parse(readJson('srd-5.1/spells.json'));
  const previous = new Map<string, SpellData>(srd51.map((s) => [s.id, s]));
  await complete51(phb, srd51);

  const srd = spell.filter((s) => s.srd52).sort((a, b) => toSpellId(a).localeCompare(toSpellId(b)));

  const spells = srd.map((s) => {
    // The lookup is keyed by the book's name, in lower case; only the book's own class lists count
    const byBook = lookup.xphb?.[s.name.toLowerCase()]?.class?.XPHB ?? {};
    const classes = Object.keys(byBook)
      .map((c) => c.toLowerCase())
      .sort();
    return spellDataSchema.parse(toSpellData(s, classes, previous.get(toSpellId(s))));
  });
  const texts = Object.fromEntries(
    srd.map((s) => [toSpellId(s), spellTextSchema.parse(toSpellText(s))]),
  );

  await write(path.join(OUT, 'spells.json'), spells);
  await write(path.join(OUT, 'i18n/en/spells.json'), texts);
  const pt = path.join(OUT, 'i18n/pt/spells.json');
  if (!existsSync(pt)) await write(pt, {});

  console.log(`SRD 5.2: ${spells.length} spells, SRD 5.1 completed, from 5etools ${VERSION}`);
}

await main();

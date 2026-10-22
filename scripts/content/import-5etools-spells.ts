/**
 * Imports the SRD 5.2 spells from 5etools into content/dnd5e/srd-5.2/.
 *
 *   npm run content:spells
 *
 * Only entries 5etools marks as SRD 5.2 (`srd52`). Rewrites the rules data and the English texts;
 * translations (i18n/<locale>/) come from Crowdin and are never touched, apart from creating an
 * empty file for Portuguese the first time.
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';
import { z } from 'zod';

import {
  type SpellData,
  spellDataSchema,
  spellTextSchema,
} from '@shared/systems/dnd5e/content/spell.schema';

import { type FiveToolsSpell, toSpellData, toSpellId, toSpellText } from './5etools-spells';

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

// Formatted as the pre-commit hook would, so running the import again leaves no diff
async function write(file: string, data: unknown) {
  const options = await resolveConfig(file);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, await format(JSON.stringify(data), { ...options, filepath: file }));
}

async function main() {
  const { spell } = await fetchJson<{ spell: FiveToolsSpell[] }>('spells/spells-xphb.json');
  const lookup = await fetchJson<ClassLookup>('generated/gendata-spell-source-lookup.json');

  const srd51 = z
    .array(spellDataSchema)
    .parse(JSON.parse(readFileSync(path.join(ROOT, 'srd-5.1/spells.json'), 'utf8')));
  const previous = new Map<string, SpellData>(srd51.map((s) => [s.id, s]));

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

  console.log(`SRD 5.2: ${spells.length} spells from 5etools ${VERSION}`);
}

await main();

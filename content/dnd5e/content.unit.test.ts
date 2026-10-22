import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  spellDataSchema,
  spellTextSchema,
  spellTranslationSchema,
} from '@shared/systems/dnd5e/content/spell.schema';

const read = (source: string, file: string): unknown =>
  JSON.parse(readFileSync(path.join(import.meta.dirname, source, file), 'utf8'));

const spellsOf = (source: string) => z.array(spellDataSchema).parse(read(source, 'spells.json'));
const textsOf = (source: string, locale: string) =>
  z
    .record(z.string(), locale === 'en' ? spellTextSchema : spellTranslationSchema)
    .parse(read(source, `i18n/${locale}/spells.json`));

describe.each([
  { source: 'srd-5.1', count: 319 },
  { source: 'srd-5.2', count: 339 },
])('magias do $source', ({ source, count }) => {
  const spells = spellsOf(source);

  it('toda magia passa no schema e os ids são únicos', () => {
    expect(spells).toHaveLength(count);
    expect(new Set(spells.map((s) => s.id)).size).toBe(spells.length);
  });

  it('toda magia tem texto em inglês', () => {
    const en = textsOf(source, 'en');
    expect(spells.filter((s) => !en[s.id]).map((s) => s.id)).toEqual([]);
  });

  it('as traduções só têm ids que existem', () => {
    const ids = new Set(spells.map((s) => s.id));
    for (const locale of ['en', 'pt']) {
      expect(Object.keys(textsOf(source, locale)).filter((id) => !ids.has(id))).toEqual([]);
    }
  });

  // What the importer can't convert would show up as raw 5etools markup ({@damage 8d6})
  it('nenhum texto em inglês tem marcação do 5etools', () => {
    const en = textsOf(source, 'en');
    const withMarkup = Object.entries(en)
      .filter(([, text]) => Object.values(text).some((value) => /\{@|[{}]/.test(value ?? '')))
      .map(([id]) => id);
    expect(withMarkup).toEqual([]);
  });
});

// Crowdin exports untranslated texts as "", so a missing description is "" or no entry at all
it('em português, no SRD 5.1, faltam só as 4 conhecidas', () => {
  const pt = textsOf('srd-5.1', 'pt');
  expect(
    spellsOf('srd-5.1')
      .filter((s) => !pt[s.id]?.description)
      .map((s) => s.id),
  ).toEqual([
    'commune-with-nature',
    'meld-into-stone',
    'pass-without-trace',
    'protection-from-energy',
  ]);
});

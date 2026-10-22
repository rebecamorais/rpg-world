import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  spellDataSchema,
  spellTextSchema,
  spellTranslationSchema,
} from '@shared/systems/dnd5e/content/spell.schema';

const SRD_51 = path.join(import.meta.dirname, 'srd-5.1');
const read = (file: string): unknown => JSON.parse(readFileSync(path.join(SRD_51, file), 'utf8'));

const spells = z.array(spellDataSchema).parse(read('spells.json'));
const texts = (locale: string) =>
  z
    .record(z.string(), locale === 'en' ? spellTextSchema : spellTranslationSchema)
    .parse(read(`i18n/${locale}/spells.json`));

describe('magias do SRD 5.1', () => {
  it('toda magia passa no schema e os ids são únicos', () => {
    expect(spells).toHaveLength(319);
    expect(new Set(spells.map((s) => s.id)).size).toBe(spells.length);
  });

  it('toda magia tem texto em inglês', () => {
    const en = texts('en');
    expect(spells.filter((s) => !en[s.id]).map((s) => s.id)).toEqual([]);
  });

  it('as traduções só têm ids que existem', () => {
    const ids = new Set(spells.map((s) => s.id));
    for (const locale of ['en', 'pt']) {
      expect(Object.keys(texts(locale)).filter((id) => !ids.has(id))).toEqual([]);
    }
  });

  // Crowdin exports untranslated texts as "", so a missing description is "" or no entry at all
  it('em português faltam só as 4 conhecidas', () => {
    const pt = texts('pt');
    expect(spells.filter((s) => !pt[s.id]?.description).map((s) => s.id)).toEqual([
      'commune-with-nature',
      'meld-into-stone',
      'pass-without-trace',
      'protection-from-energy',
    ]);
  });
});

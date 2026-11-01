import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { conditionIdsOf, stripTags, tagsOf } from '@shared/content/tags';
import {
  conditionDataSchema,
  conditionTextSchema,
  conditionTranslationSchema,
} from '@shared/systems/dnd5e/content/condition.schema';
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

const conditionsOf = (source: string) =>
  z.array(conditionDataSchema).parse(read(source, 'conditions.json'));
const conditionTextsOf = (source: string, locale: string) =>
  z
    .record(z.string(), locale === 'en' ? conditionTextSchema : conditionTranslationSchema)
    .parse(read(source, `i18n/${locale}/conditions.json`));

const SOURCES = ['srd-5.1', 'srd-5.2'];

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

  it('toda reação diz quando é usada', () => {
    const en = textsOf(source, 'en');
    expect(spells.filter((s) => s.castingTime === 'reaction' && !en[s.id].trigger)).toEqual([]);
  });

  it('Plant Growth tem os dois tempos de conjuração', () => {
    expect(spells.find((s) => s.id === 'plant-growth')?.extraCastingTimes).toEqual([
      { castingTime: 'hour', castingValue: 8 },
    ]);
  });

  // Markup that loses its braces but not its meaning: a filter (type=beast), a DC without "DC"
  it('nenhum texto em inglês tem resto de marcação sem chaves', () => {
    const en = textsOf(source, 'en');
    const leaked = Object.entries(en)
      .filter(([, text]) =>
        Object.values(text).some((value) => {
          const plain = stripTags(value ?? '');
          return (
            /\b[a-z]+=\S/.test(plain) ||
            /\b(a|an) \d+ (Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)\b/.test(
              plain,
            )
          );
        }),
      )
      .map(([id]) => id);
    expect(leaked).toEqual([]);
  });
});

describe.each(SOURCES)('condições do %s', (source) => {
  const conditions = conditionsOf(source);

  it('toda condição passa no schema, os ids são únicos e são 15', () => {
    expect(conditions).toHaveLength(15);
    expect(new Set(conditions.map((c) => c.id)).size).toBe(conditions.length);
  });

  it('toda condição tem texto em inglês', () => {
    const en = conditionTextsOf(source, 'en');
    expect(conditions.filter((c) => !en[c.id]).map((c) => c.id)).toEqual([]);
  });

  it('as traduções só têm ids que existem', () => {
    const ids = new Set(conditions.map((c) => c.id));
    for (const locale of ['en', 'pt']) {
      expect(Object.keys(conditionTextsOf(source, locale)).filter((id) => !ids.has(id))).toEqual(
        [],
      );
    }
  });

  it('só a exaustão tem nível, de 1 a 6', () => {
    expect(conditions.find((c) => c.id === 'exhaustion')?.maxLevel).toBe(6);
    expect(conditions.filter((c) => c.maxLevel && c.id !== 'exhaustion')).toEqual([]);
  });
});

// A condition tag is a link: it must land on a condition of the same book
describe.each(SOURCES)('tags de condição do %s', (source) => {
  it('toda tag condition aponta para uma condição do mesmo livro', () => {
    const ids = new Set(conditionsOf(source).map((c) => c.id));
    const texts = [
      ...Object.values(textsOf(source, 'en')),
      ...Object.values(conditionTextsOf(source, 'en')),
    ];
    const missing = texts.flatMap((text) =>
      conditionIdsOf(...Object.values(text)).filter((id) => !ids.has(id)),
    );
    expect([...new Set(missing)]).toEqual([]);
  });
});

// Translations keep the tags of the English text, so a link survives translation
const tagKeys = (text: string) =>
  tagsOf(text)
    .map(({ tag, target }) => `${tag}:${target}`)
    .sort();

describe.each(SOURCES)('tags nas traduções do %s', (source) => {
  const locales = readdirSync(path.join(import.meta.dirname, source, 'i18n'));
  const has = (locale: string, kind: string) =>
    existsSync(path.join(import.meta.dirname, source, 'i18n', locale, `${kind}.json`));

  it.each(['spells', 'conditions'])('%s: as mesmas tags do inglês em cada campo', (kind) => {
    const load = (locale: string): Record<string, Record<string, string | undefined>> =>
      kind === 'spells' ? textsOf(source, locale) : conditionTextsOf(source, locale);
    const en = load('en');
    const different: string[] = [];
    for (const locale of locales.filter((l) => l !== 'en' && has(l, kind))) {
      for (const [id, text] of Object.entries(load(locale))) {
        for (const [field, value] of Object.entries(text)) {
          if (value && tagKeys(value).join() !== tagKeys(en[id]?.[field] ?? '').join()) {
            different.push(`${locale}/${id}/${field}`);
          }
        }
      }
    }
    expect(different).toEqual([]);
  });
});

const KINDS = ['spells', 'conditions'] as const;
const textsOfKind = (source: string, locale: string, kind: (typeof KINDS)[number]) =>
  (kind === 'spells' ? textsOf(source, locale) : conditionTextsOf(source, locale)) as Record<
    string,
    Record<string, string | undefined>
  >;

/** Every content file of the book, in every locale: `[locale, kind]`. */
const contentFilesOf = (source: string) =>
  readdirSync(path.join(import.meta.dirname, source, 'i18n')).flatMap((locale) =>
    KINDS.filter((kind) =>
      existsSync(path.join(import.meta.dirname, source, 'i18n', locale, `${kind}.json`)),
    ).map((kind) => [locale, kind] as const),
  );

describe.each(SOURCES)('marcação nos textos do %s', (source) => {
  // What the importer can't convert would show up as raw 5etools markup that tags don't cover
  it.each(contentFilesOf(source))('%s/%s: nenhum texto tem marcação sem fechar', (locale, kind) => {
    const withMarkup = Object.entries(textsOfKind(source, locale, kind))
      .filter(([, text]) =>
        Object.values(text).some((value) => /\{@|[{}]/.test(stripTags(value ?? ''))),
      )
      .map(([id]) => id);
    expect(withMarkup).toEqual([]);
  });

  // Without a display part the translated text would show the English condition name
  it.each(contentFilesOf(source).filter(([locale]) => locale !== 'en'))(
    '%s/%s: toda tag condition traduzida tem a palavra de exibição',
    (locale, kind) => {
      const bare = Object.entries(textsOfKind(source, locale, kind)).flatMap(([id, text]) =>
        Object.entries(text).flatMap(([field, value]) =>
          [...(value ?? '').matchAll(/\{@condition ([^{}]*)\}/g)]
            .filter(([, body]) => !body.split('|')[2]?.trim())
            .map(([tag]) => `${id}/${field}: ${tag}`),
        ),
      );
      expect(bare).toEqual([]);
    },
  );
});

// Foundry VTT links (`@UUID[...]{text}`, `@Compendium[...]{text}`, ...) would show as raw markup
describe.each(SOURCES)('textos do %s', (source) => {
  it('nenhum link do Foundry sobra nos textos', () => {
    const dir = path.join(import.meta.dirname, source, 'i18n');
    const found = readdirSync(dir).flatMap((locale) =>
      readdirSync(path.join(dir, locale))
        .filter((file) => readFileSync(path.join(dir, locale, file), 'utf8').match(/@[A-Za-z]+\[/))
        .map((file) => `${locale}/${file}`),
    );
    expect(found).toEqual([]);
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

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { conditionIdsOf, stripTags, tagsOf } from '@shared/content/tags';
import {
  type ClassData,
  classDataSchema,
  classTextSchema,
  classTranslationSchema,
} from '@shared/systems/dnd5e/content/class.schema';
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

import type { ClassBook } from '../../scripts/content/5etools-classes';
import { CLASS_RESOURCES } from '../../scripts/content/class-resources';

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

const classesOf = (source: string) => z.array(classDataSchema).parse(read(source, 'classes.json'));
const classTextsOf = (source: string, locale: string) =>
  z
    .record(z.string(), locale === 'en' ? classTextSchema : classTranslationSchema)
    .parse(read(source, `i18n/${locale}/classes.json`));
const englishClassTextsOf = (source: string) =>
  z.record(z.string(), classTextSchema).parse(read(source, 'i18n/en/classes.json'));

/** Class texts are nested (class → features → id): as flat records of fields, keyed by path. */
function flatTexts(texts: object, path = ''): Record<string, Record<string, string | undefined>> {
  const fields: Record<string, string> = {};
  const nested = Object.entries(texts).flatMap(([key, value]) => {
    if (typeof value === 'string') fields[key] = value;
    return value && typeof value === 'object'
      ? Object.entries(flatTexts(value, path ? `${path}/${key}` : key))
      : [];
  });
  return Object.fromEntries([...(Object.keys(fields).length ? [[path, fields]] : []), ...nested]);
}

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

describe.each(SOURCES)('classes do %s', (source) => {
  const classes = classesOf(source);
  const en = englishClassTextsOf(source);

  it('as 12 classes passam no schema, com ids únicos e uma subclasse cada', () => {
    expect(classes.map((c) => c.id)).toEqual([
      'barbarian',
      'bard',
      'cleric',
      'druid',
      'fighter',
      'monk',
      'paladin',
      'ranger',
      'rogue',
      'sorcerer',
      'warlock',
      'wizard',
    ]);
    expect(classes.filter((c) => c.subclasses.length !== 1).map((c) => c.id)).toEqual([]);
  });

  it('todo id dos dados tem texto em inglês, e só eles', () => {
    const ids = (list: { id: string }[]) => list.map((x) => x.id).sort();
    for (const c of classes) {
      const text = en[c.id];
      expect(Object.keys(text.features).sort()).toEqual(ids(c.features));
      expect(Object.keys(text.resources).sort()).toEqual(ids(c.resources));
      expect(Object.keys(text.choices).sort()).toEqual(ids(c.choices));
      expect(Object.keys(text.subclasses).sort()).toEqual(ids(c.subclasses));
      for (const s of c.subclasses) {
        expect(Object.keys(text.subclasses[s.id].features).sort()).toEqual(ids(s.features));
        expect(Object.keys(text.subclasses[s.id].resources).sort()).toEqual(ids(s.resources));
      }
    }
    expect(Object.keys(en).sort()).toEqual(ids(classes));
  });

  it('as traduções só têm ids que existem', () => {
    const paths = new Set(Object.keys(flatTexts(en)));
    for (const locale of ['en', 'pt']) {
      expect(
        Object.keys(flatTexts(classTextsOf(source, locale))).filter((p) => !paths.has(p)),
      ).toEqual([]);
    }
  });

  it('todo recurso vem de uma característica da mesma classe ou subclasse, no nível dela', () => {
    const wrong = classes.flatMap((c) =>
      [c, ...c.subclasses].flatMap(({ features, resources }) =>
        resources
          .filter((r) => {
            const feature = features.find((f) => f.id === r.feature);
            const first = r.max.type === 'steps' ? r.max.steps[0].level : r.level;
            return !feature || r.level < feature.level || first !== r.level;
          })
          .map((r) => `${c.id}/${r.id}`),
      ),
    );
    expect(wrong).toEqual([]);
  });

  it('armas e ferramentas apontam para itens do mesmo livro', () => {
    const items = new Set(
      z
        .array(z.object({ id: z.string() }).passthrough())
        .parse(read(source, 'items.json'))
        .map((i) => i.id),
    );
    const missing = classes.flatMap(({ id, proficiencies: p }) =>
      [...p.weapons.filter((w) => w !== 'simple' && w !== 'martial'), ...p.tools]
        .filter((item) => !items.has(item))
        .map((item) => `${id}: ${item}`),
    );
    expect(missing).toEqual([]);
  });
});

describe('recursos de classe', () => {
  const resource = (source: string, classId: string, id: string) =>
    classesOf(source)
      .find((c) => c.id === classId)
      ?.resources.find((r) => r.id === id);

  it('no SRD 5.1, a Fúria fica ilimitada no nível 20 e volta no descanso longo', () => {
    const rage = resource('srd-5.1', 'barbarian', 'rage');
    expect(rage?.max).toEqual({
      type: 'steps',
      steps: [
        { level: 1, value: 2 },
        { level: 3, value: 3 },
        { level: 6, value: 4 },
        { level: 12, value: 5 },
        { level: 17, value: 6 },
        { level: 20, value: null },
      ],
    });
    expect(rage?.recovery).toEqual([{ rest: 'long', amount: 'all' }]);
  });

  it('no SRD 5.2, a Fúria devolve um uso no descanso curto', () => {
    expect(resource('srd-5.2', 'barbarian', 'rage')?.recovery).toEqual([
      { rest: 'short', amount: 1 },
      { rest: 'long', amount: 'all' },
    ]);
  });

  it('a Inspiração de Bardo usa Carisma e volta no descanso curto a partir do nível 5', () => {
    for (const source of SOURCES) {
      const inspiration = resource(source, 'bard', 'bardic-inspiration');
      expect(inspiration?.max).toEqual({ type: 'ability', ability: 'CHA', bonus: 0, minimum: 1 });
      expect(inspiration?.recovery).toContainEqual({ rest: 'short', amount: 'all', fromLevel: 5 });
      expect(inspiration?.die?.map((d) => d.value)).toEqual([6, 8, 10, 12]);
    }
  });

  it('os espaços de pacto voltam no descanso curto e sobem até o 5º círculo', () => {
    for (const source of SOURCES) {
      const slots = resource(source, 'warlock', 'pact-slots');
      expect(slots?.recovery).toContainEqual({ rest: 'short', amount: 'all' });
      expect(slots?.spellLevel?.at(-1)).toEqual({ level: 9, value: 5 });
    }
  });

  it('no SRD 5.1, o Sentido Divino é 1 + Carisma, sem mínimo de 1', () => {
    expect(resource('srd-5.1', 'paladin', 'divine-sense')?.max).toEqual({
      type: 'ability',
      ability: 'CHA',
      bonus: 1,
      minimum: 0,
    });
  });
});

/*
 * The sheet saves what the player did to a class box (used, hidden, edits) under this key. A key
 * that disappears or changes loses that, so the importer may add resources but never drop or
 * rename one (#213). Changing what a saved value means needs its own plan, like Signature Spells.
 */
const SAVED_KEYS: Record<string, string[]> = {
  'srd-5.1': [
    'class:barbarian:rage',
    'class:bard:bardic-inspiration',
    'class:cleric:channel-divinity',
    'class:cleric:divine-intervention',
    'class:druid:wild-shape',
    'subclass:druid/land:natural-recovery',
    'class:fighter:second-wind',
    'class:fighter:action-surge',
    'class:fighter:indomitable',
    'class:monk:ki',
    'subclass:monk/open-hand:wholeness-of-body',
    'class:paladin:divine-sense',
    'class:paladin:lay-on-hands',
    'class:paladin:channel-divinity',
    'class:paladin:cleansing-touch',
    'subclass:paladin/devotion:holy-nimbus',
    'class:rogue:stroke-of-luck',
    'class:sorcerer:sorcery-points',
    'class:warlock:pact-slots',
    'class:warlock:mystic-arcanum-6',
    'class:warlock:mystic-arcanum-7',
    'class:warlock:mystic-arcanum-8',
    'class:warlock:mystic-arcanum-9',
    'class:warlock:eldritch-master',
    'subclass:warlock/fiend:dark-one-s-own-luck',
    'subclass:warlock/fiend:hurl-through-hell',
    'class:wizard:arcane-recovery',
    'class:wizard:signature-spells',
    'subclass:wizard/evocation:overchannel',
  ],
  'srd-5.2': [
    'class:barbarian:rage',
    'class:barbarian:persistent-rage',
    'subclass:barbarian/berserker:intimidating-presence',
    'class:bard:bardic-inspiration',
    'class:cleric:channel-divinity',
    'class:cleric:divine-intervention',
    'class:druid:wild-shape',
    'class:druid:wild-resurgence',
    'class:druid:nature-magician',
    'subclass:druid/land:natural-recovery-spell',
    'subclass:druid/land:natural-recovery-slots',
    'class:fighter:second-wind',
    'class:fighter:action-surge',
    'class:fighter:indomitable',
    'class:monk:focus-points',
    'class:monk:uncanny-metabolism',
    'subclass:monk/open-hand:wholeness-of-body',
    'class:paladin:lay-on-hands',
    'class:paladin:paladin-s-smite',
    'class:paladin:channel-divinity',
    'class:paladin:faithful-steed',
    'subclass:paladin/devotion:holy-nimbus',
    'class:ranger:favored-enemy',
    'class:ranger:tireless',
    'class:ranger:nature-s-veil',
    'class:rogue:stroke-of-luck',
    'class:sorcerer:innate-sorcery',
    'class:sorcerer:sorcery-points',
    'class:sorcerer:sorcerous-restoration',
    'subclass:sorcerer/draconic:dragon-wings',
    'subclass:sorcerer/draconic:dragon-companion',
    'class:warlock:pact-slots',
    'class:warlock:magical-cunning',
    'class:warlock:contact-patron',
    'class:warlock:mystic-arcanum-6',
    'class:warlock:mystic-arcanum-7',
    'class:warlock:mystic-arcanum-8',
    'class:warlock:mystic-arcanum-9',
    'subclass:warlock/fiend:dark-one-s-own-luck',
    'subclass:warlock/fiend:hurl-through-hell',
    'class:wizard:arcane-recovery',
    'class:wizard:signature-spells',
    'subclass:wizard/evoker:overchannel',
  ],
};

describe.each(SOURCES)('chaves salvas nas fichas do %s', (source) => {
  it('todo recurso que já existia continua com o mesmo id', () => {
    const keys = classesOf(source).flatMap((c) => [
      ...c.resources.map((r) => `class:${c.id}:${r.id}`),
      ...c.subclasses.flatMap((s) => s.resources.map((r) => `subclass:${c.id}/${s.id}:${r.id}`)),
    ]);
    expect(keys).toEqual(expect.arrayContaining(SAVED_KEYS[source]));
  });

  // The keys above are read from the generated file: this keeps it in step with the importer's
  // source, so a fix made there and never regenerated (`npm run content:classes`) fails here too.
  // Values read from the class table (`column`) are checked by the importer itself.
  it('o arquivo gerado bate com o class-resources.ts do importador', () => {
    const specs = CLASS_RESOURCES[source as ClassBook];
    const classes = classesOf(source);
    const texts = englishClassTextsOf(source);
    expect(classes.map((c) => c.id).sort()).toEqual(Object.keys(specs).sort());

    const fromTable = (value: unknown) =>
      typeof value === 'object' && value !== null && 'column' in value;
    const compare = (
      label: string,
      data: ClassData['resources'],
      spec: (typeof specs)[string]['class'],
      resourceTexts: Record<string, { name: string; note?: string }>,
    ) => {
      expect(
        data.map((r) => r.id),
        label,
      ).toEqual(spec.map((s) => s.id));
      for (const [i, s] of spec.entries()) {
        const r = data[i];
        const at = `${label}:${s.id}`;
        expect(r.feature, at).toBe(s.feature);
        expect(r.unit, at).toBe(s.unit);
        expect(r.recovery, at).toEqual(s.recovery);
        for (const field of ['max', 'die', 'spellLevel'] as const) {
          if (!fromTable(s[field])) expect(r[field], `${at} ${field}`).toEqual(s[field]);
        }
        expect(resourceTexts[s.id], at).toEqual(
          s.note ? { name: s.name, note: s.note } : { name: s.name },
        );
      }
    };

    for (const c of classes) {
      expect(c.subclasses, c.id).toHaveLength(1);
      const [sub] = c.subclasses;
      compare(c.id, c.resources, specs[c.id].class, texts[c.id].resources);
      compare(
        `${c.id}/${sub.id}`,
        sub.resources,
        specs[c.id].subclass,
        texts[c.id].subclasses[sub.id].resources,
      );
    }
  });
});

// A condition tag is a link: it must land on a condition of the same book
describe.each(SOURCES)('tags de condição do %s', (source) => {
  it('toda tag condition aponta para uma condição do mesmo livro', () => {
    const ids = new Set(conditionsOf(source).map((c) => c.id));
    const texts = [
      ...Object.values(textsOf(source, 'en')),
      ...Object.values(conditionTextsOf(source, 'en')),
      ...Object.values(flatTexts(classTextsOf(source, 'en'))),
    ];
    const missing = texts.flatMap((text) =>
      conditionIdsOf(...Object.values(text)).filter((id) => !ids.has(id)),
    );
    expect([...new Set(missing)]).toEqual([]);
  });
});

const KINDS = ['spells', 'conditions', 'classes'] as const;
const textsOfKind = (
  source: string,
  locale: string,
  kind: (typeof KINDS)[number],
): Record<string, Record<string, string | undefined>> =>
  kind === 'spells'
    ? textsOf(source, locale)
    : kind === 'conditions'
      ? conditionTextsOf(source, locale)
      : flatTexts(classTextsOf(source, locale));

// The first part of these tags is the text they show: a translation changes it and keeps the rest
const SHOWN_FIRST = new Set(['filter', 'book', 'adventure', 'i', 'b']);

// Translations keep the tags of the English text, so a link survives translation
const tagKeys = (text: string) =>
  tagsOf(text)
    .map(({ tag, target, rest }) => `${tag}:${SHOWN_FIRST.has(tag) ? rest.toLowerCase() : target}`)
    .sort();

describe.each(SOURCES)('tags nas traduções do %s', (source) => {
  const locales = readdirSync(path.join(import.meta.dirname, source, 'i18n'));
  const has = (locale: string, kind: string) =>
    existsSync(path.join(import.meta.dirname, source, 'i18n', locale, `${kind}.json`));

  it.each(KINDS)('%s: as mesmas tags do inglês em cada campo', (kind) => {
    const load = (locale: string) => textsOfKind(source, locale, kind);
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

// Untranslated texts may come back as "", so a missing description is "" or no entry at all
it('em português, no SRD 5.1, não falta descrição além das 4 que já faltaram', () => {
  const pt = textsOf('srd-5.1', 'pt');
  const known = [
    'commune-with-nature',
    'meld-into-stone',
    'pass-without-trace',
    'protection-from-energy',
  ];
  expect(
    spellsOf('srd-5.1')
      .filter((s) => !pt[s.id]?.description && !known.includes(s.id))
      .map((s) => s.id),
  ).toEqual([]);
});

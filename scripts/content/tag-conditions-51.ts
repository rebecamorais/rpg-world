/**
 * Tags the conditions in the SRD 5.1 spell texts, English and Portuguese, once:
 *
 *   npx tsx scripts/content/tag-conditions-51.ts
 *
 * 5etools has no tags in the SRD 5.1 texts, so they are added here by word. The result was
 * reviewed by hand (ordinary uses of a word untagged, en and pt made to tag the same conditions);
 * running it again redoes only the word matching, and its diff needs the same review.
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { writeFormatted } from '../write-formatted';
import { type ConditionForms, type TagOptions, tagConditions } from './tag-conditions';

const I18N = path.join(import.meta.dirname, '../../content/dnd5e/srd-5.1/i18n');
const FIELDS = ['description', 'higherLevel', 'trigger', 'material'];

const ids = (
  JSON.parse(readFileSync(path.join(I18N, '../conditions.json'), 'utf8')) as { id: string }[]
).map((c) => c.id);

// Each name in masculine, feminine, singular and plural, as the 5.1 Portuguese spells write them
const PT: Record<string, string[]> = {
  blinded: ['cego', 'cega', 'cegos', 'cegas'],
  charmed: ['enfeitiçado', 'enfeitiçada', 'enfeitiçados', 'enfeitiçadas'],
  deafened: ['surdo', 'surda', 'surdos', 'surdas'],
  exhaustion: ['exaustão'],
  frightened: ['amedrontado', 'amedrontada', 'amedrontados', 'amedrontadas'],
  grappled: ['agarrado', 'agarrada', 'agarrados', 'agarradas'],
  incapacitated: ['incapacitado', 'incapacitada', 'incapacitados', 'incapacitadas'],
  invisible: ['invisível', 'invisíveis'],
  paralyzed: ['paralisado', 'paralisada', 'paralisados', 'paralisadas'],
  petrified: ['petrificado', 'petrificada', 'petrificados', 'petrificadas'],
  poisoned: ['envenenado', 'envenenada', 'envenenados', 'envenenadas'],
  prone: ['caído', 'caída', 'caídos', 'caídas'],
  restrained: ['contido', 'contida', 'contidos', 'contidas'],
  stunned: ['atordoado', 'atordoada', 'atordoados', 'atordoadas'],
  unconscious: ['inconsciente', 'inconscientes'],
};

async function tagLocale(locale: string, forms: ConditionForms[], options: TagOptions) {
  const file = path.join(I18N, locale, 'spells.json');
  const texts = JSON.parse(readFileSync(file, 'utf8')) as Record<string, Record<string, string>>;
  for (const text of Object.values(texts)) {
    for (const field of FIELDS) {
      if (text[field]) text[field] = tagConditions(text[field], forms, options);
    }
  }
  await writeFormatted(file, JSON.stringify(texts));
}

await tagLocale(
  'en',
  ids.map((id) => ({ id, words: [id] })),
  { display: 'when-different' },
);
await tagLocale(
  'pt',
  ids.map((id) => ({ id, words: PT[id] })),
  { display: 'always' },
);

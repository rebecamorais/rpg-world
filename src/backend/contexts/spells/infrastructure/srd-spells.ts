import 'server-only';
import { z } from 'zod';

import { SOURCE_EDITION } from '@shared/systems/dnd5e/content/editions';
import {
  spellDataSchema,
  spellTextSchema,
  spellTranslationSchema,
} from '@shared/systems/dnd5e/content/spell.schema';

import en51 from '../../../../../content/dnd5e/srd-5.1/i18n/en/spells.json';
import pt51 from '../../../../../content/dnd5e/srd-5.1/i18n/pt/spells.json';
import spells51 from '../../../../../content/dnd5e/srd-5.1/spells.json';
import en52 from '../../../../../content/dnd5e/srd-5.2/i18n/en/spells.json';
import pt52 from '../../../../../content/dnd5e/srd-5.2/i18n/pt/spells.json';
import spells52 from '../../../../../content/dnd5e/srd-5.2/spells.json';
import { FileSpellCatalog, type SpellSource } from './file-spell-catalog';

const texts = z.record(z.string(), spellTextSchema);
const translations = z.record(z.string(), spellTranslationSchema);

const load = (source: string, spells: unknown, en: unknown, pt: unknown): SpellSource => ({
  source,
  edition: SOURCE_EDITION[source],
  spells: z.array(spellDataSchema).parse(spells),
  texts: texts.parse(en),
  translations: { pt: translations.parse(pt) },
});

let catalog: FileSpellCatalog | undefined;

/** The official spells (SRD 5.1 and 5.2), loaded and checked once per server instance. */
export function getSpellCatalog(): FileSpellCatalog {
  catalog ??= new FileSpellCatalog([
    load('srd-5.1', spells51, en51, pt51),
    load('srd-5.2', spells52, en52, pt52),
  ]);
  return catalog;
}

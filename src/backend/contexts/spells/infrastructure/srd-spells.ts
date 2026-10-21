import 'server-only';
import { z } from 'zod';

import { spellDataSchema, spellTextSchema } from '@shared/systems/dnd5e/content/spell.schema';

import en from '../../../../../content/dnd5e/srd-5.1/i18n/en/spells.json';
import pt from '../../../../../content/dnd5e/srd-5.1/i18n/pt/spells.json';
import spells from '../../../../../content/dnd5e/srd-5.1/spells.json';
import { FileSpellCatalog } from './file-spell-catalog';

const texts = z.record(z.string(), spellTextSchema);

let catalog: FileSpellCatalog | undefined;

/** The official spells (SRD 5.1), loaded and checked once per server instance. */
export function getSpellCatalog(): FileSpellCatalog {
  catalog ??= new FileSpellCatalog([
    {
      source: 'srd-5.1',
      spells: z.array(spellDataSchema).parse(spells),
      texts: { en: texts.parse(en), pt: texts.parse(pt) },
    },
  ]);
  return catalog;
}

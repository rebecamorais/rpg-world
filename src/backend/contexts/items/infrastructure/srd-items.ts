import 'server-only';
import { z } from 'zod';

import { SOURCE_EDITION } from '@shared/systems/dnd5e/content/editions';
import {
  itemDataSchema,
  itemTextSchema,
  itemTranslationSchema,
} from '@shared/systems/dnd5e/content/item.schema';

import en51 from '../../../../../content/dnd5e/srd-5.1/i18n/en/items.json';
import pt51 from '../../../../../content/dnd5e/srd-5.1/i18n/pt/items.json';
import items51 from '../../../../../content/dnd5e/srd-5.1/items.json';
import en52 from '../../../../../content/dnd5e/srd-5.2/i18n/en/items.json';
import pt52 from '../../../../../content/dnd5e/srd-5.2/i18n/pt/items.json';
import items52 from '../../../../../content/dnd5e/srd-5.2/items.json';
import { FileItemCatalog, type ItemSource } from './file-item-catalog';

const texts = z.record(z.string(), itemTextSchema);
const translations = z.record(z.string(), itemTranslationSchema);

const load = (source: string, items: unknown, en: unknown, pt: unknown): ItemSource => ({
  source,
  edition: SOURCE_EDITION[source],
  items: z.array(itemDataSchema).parse(items),
  texts: texts.parse(en),
  translations: { pt: translations.parse(pt) },
});

let catalog: FileItemCatalog | undefined;

/** The official common items (SRD 5.1 and 5.2), loaded and checked once per server instance. */
export function getItemCatalog(): FileItemCatalog {
  catalog ??= new FileItemCatalog([
    load('srd-5.1', items51, en51, pt51),
    load('srd-5.2', items52, en52, pt52),
  ]);
  return catalog;
}

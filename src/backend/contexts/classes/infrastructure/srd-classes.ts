import 'server-only';
import { z } from 'zod';

import {
  classDataSchema,
  classTextSchema,
  classTranslationSchema,
} from '@shared/systems/dnd5e/content/class.schema';
import { SOURCE_EDITION } from '@shared/systems/dnd5e/content/editions';

import classes51 from '../../../../../content/dnd5e/srd-5.1/classes.json';
import en51 from '../../../../../content/dnd5e/srd-5.1/i18n/en/classes.json';
import pt51 from '../../../../../content/dnd5e/srd-5.1/i18n/pt/classes.json';
import classes52 from '../../../../../content/dnd5e/srd-5.2/classes.json';
import en52 from '../../../../../content/dnd5e/srd-5.2/i18n/en/classes.json';
import pt52 from '../../../../../content/dnd5e/srd-5.2/i18n/pt/classes.json';
import { type ClassSource, FileClassCatalog } from './file-class-catalog';

const texts = z.record(z.string(), classTextSchema);
const translations = z.record(z.string(), classTranslationSchema);

const load = (source: string, classes: unknown, en: unknown, pt: unknown): ClassSource => ({
  edition: SOURCE_EDITION[source],
  classes: z.array(classDataSchema).parse(classes),
  texts: texts.parse(en),
  translations: { pt: translations.parse(pt) },
});

let catalog: FileClassCatalog | undefined;

/** The official classes (SRD 5.1 and 5.2), loaded and checked once per server instance. */
export function getClassCatalog(): FileClassCatalog {
  catalog ??= new FileClassCatalog([
    load('srd-5.1', classes51, en51, pt51),
    load('srd-5.2', classes52, en52, pt52),
  ]);
  return catalog;
}

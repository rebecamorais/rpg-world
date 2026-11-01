import 'server-only';
import { z } from 'zod';

import {
  conditionDataSchema,
  conditionTextSchema,
  conditionTranslationSchema,
} from '@shared/systems/dnd5e/content/condition.schema';
import { SOURCE_EDITION } from '@shared/systems/dnd5e/content/editions';

import conditions51 from '../../../../../content/dnd5e/srd-5.1/conditions.json';
import en51 from '../../../../../content/dnd5e/srd-5.1/i18n/en/conditions.json';
import pt51 from '../../../../../content/dnd5e/srd-5.1/i18n/pt/conditions.json';
import conditions52 from '../../../../../content/dnd5e/srd-5.2/conditions.json';
import en52 from '../../../../../content/dnd5e/srd-5.2/i18n/en/conditions.json';
import pt52 from '../../../../../content/dnd5e/srd-5.2/i18n/pt/conditions.json';
import { type ConditionSource, FileConditionCatalog } from './file-condition-catalog';

const texts = z.record(z.string(), conditionTextSchema);
const translations = z.record(z.string(), conditionTranslationSchema);

const load = (source: string, conditions: unknown, en: unknown, pt: unknown): ConditionSource => ({
  source,
  edition: SOURCE_EDITION[source],
  conditions: z.array(conditionDataSchema).parse(conditions),
  texts: texts.parse(en),
  translations: { pt: translations.parse(pt) },
});

let catalog: FileConditionCatalog | undefined;

/** The official conditions (SRD 5.1 and 5.2), loaded and checked once per server instance. */
export function getConditionCatalog(): FileConditionCatalog {
  catalog ??= new FileConditionCatalog([
    load('srd-5.1', conditions51, en51, pt51),
    load('srd-5.2', conditions52, en52, pt52),
  ]);
  return catalog;
}

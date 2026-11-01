/**
 * Imports the SRD conditions from 5etools into content/dnd5e/srd-5.1/ and srd-5.2/.
 *
 *   npm run content:conditions
 *
 * Only entries 5etools marks as SRD (`srd`, `srd52`). Rewrites the rules data and the English
 * texts, keeping the 5etools tags in the text. Translations (i18n/<locale>/) come from Crowdin and
 * are never touched, apart from creating an empty file for Portuguese the first time.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import {
  conditionDataSchema,
  conditionTextSchema,
} from '@shared/systems/dnd5e/content/condition.schema';

import { writeFormatted } from '../write-formatted';
import {
  type FiveToolsCondition,
  toConditionData,
  toConditionId,
  toConditionText,
} from './5etools-conditions';
import { VERSION, fetchJson } from './5etools-source';

const ROOT = path.join(import.meta.dirname, '../../content/dnd5e');

const write = (file: string, data: unknown) => writeFormatted(file, JSON.stringify(data));

async function importBook(book: string, conditions: FiveToolsCondition[]) {
  const sorted = [...conditions].sort((a, b) => toConditionId(a).localeCompare(toConditionId(b)));
  const data = z.array(conditionDataSchema).parse(sorted.map(toConditionData));
  const texts = Object.fromEntries(
    sorted.map((c) => [toConditionId(c), conditionTextSchema.parse(toConditionText(c))]),
  );

  const out = path.join(ROOT, book);
  await write(path.join(out, 'conditions.json'), data);
  await write(path.join(out, 'i18n/en/conditions.json'), texts);
  const pt = path.join(out, 'i18n/pt/conditions.json');
  if (!existsSync(pt)) await write(pt, {});
  return data.length;
}

async function main() {
  const { condition } = await fetchJson<{ condition: FiveToolsCondition[] }>(
    'conditionsdiseases.json',
  );
  const n52 = await importBook(
    'srd-5.2',
    condition.filter((c) => c.source === 'XPHB' && c.srd52),
  );
  const n51 = await importBook(
    'srd-5.1',
    condition.filter((c) => c.source === 'PHB' && c.srd),
  );
  console.log(`Conditions: SRD 5.2 ${n52}, SRD 5.1 ${n51}, from 5etools ${VERSION}`);
}

await main();

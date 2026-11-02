/**
 * Imports the common SRD items from 5etools into content/dnd5e/srd-5.1/ and srd-5.2/.
 *
 *   npm run content:items
 *
 * Only mundane entries 5etools marks as SRD (`srd`, `srd52`). Rewrites the rules data and the
 * English texts, keeping the 5etools tags in the text. Translations (i18n/<locale>/) come from
 * Crowdin and are never touched, apart from creating an empty file for Portuguese the first time.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { itemDataSchema, itemTextSchema } from '@shared/systems/dnd5e/content/item.schema';

import { writeFormatted } from '../write-formatted';
import {
  type FiveToolsItem,
  type ItemBook,
  isCommonSrdItem,
  toItemData,
  toItemId,
  toItemText,
} from './5etools-items';
import { VERSION, fetchJson } from './5etools-source';

const ROOT = path.join(import.meta.dirname, '../../content/dnd5e');

const write = (file: string, data: unknown) => writeFormatted(file, JSON.stringify(data));

async function importBook(book: ItemBook, all: FiveToolsItem[]) {
  const items = all.filter((item) => isCommonSrdItem(item, book));
  const sorted = [...items].sort((a, b) => toItemId(a).localeCompare(toItemId(b)));
  const ids = new Set<string>();
  for (const item of sorted) {
    const id = toItemId(item);
    if (ids.has(id)) throw new Error(`${book}: two items with id "${id}" (${item.name})`);
    ids.add(id);
  }
  const data = z.array(itemDataSchema).parse(sorted.map(toItemData));
  const texts = Object.fromEntries(
    sorted.map((item) => [toItemId(item), itemTextSchema.parse(toItemText(item))]),
  );

  const out = path.join(ROOT, book);
  await write(path.join(out, 'items.json'), data);
  await write(path.join(out, 'i18n/en/items.json'), texts);
  const pt = path.join(out, 'i18n/pt/items.json');
  if (!existsSync(pt)) await write(pt, {});
  return data.length;
}

async function main() {
  const [{ baseitem }, { item }] = await Promise.all([
    fetchJson<{ baseitem: FiveToolsItem[] }>('items-base.json'),
    fetchJson<{ item: FiveToolsItem[] }>('items.json'),
  ]);
  const all = [...baseitem, ...item];
  const n52 = await importBook('srd-5.2', all);
  const n51 = await importBook('srd-5.1', all);
  console.log(`Items: SRD 5.2 ${n52}, SRD 5.1 ${n51}, from 5etools ${VERSION}`);
}

await main();

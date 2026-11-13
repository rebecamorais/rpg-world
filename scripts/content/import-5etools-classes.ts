/**
 * Imports the SRD classes, each with its SRD subclass, from 5etools into content/dnd5e/srd-5.1/
 * and srd-5.2/.
 *
 *   npm run content:classes
 *
 * Only entries 5etools marks as SRD (`srd`, `srd52`): classes, subclasses, features, and the
 * Metamagic options or feats a feature lists. Resources (Rage, Ki…) come from class-resources.ts.
 * Rewrites the rules data and the English texts, keeping the 5etools tags in the text.
 * Translations (i18n/<locale>/) come from Crowdin and are never touched, apart from creating an
 * empty file for Portuguese the first time.
 */
import { existsSync } from 'node:fs';
import path from 'node:path';
import { z } from 'zod';

import { classDataSchema, classTextSchema } from '@shared/systems/dnd5e/content/class.schema';

import { writeFormatted } from '../write-formatted';
import {
  type ClassBook,
  type FiveToolsClassFile,
  isSrdClass,
  toClass,
  toClassId,
} from './5etools-classes';
import { VERSION, fetchJson } from './5etools-source';
import { CLASS_RESOURCES } from './class-resources';

const ROOT = path.join(import.meta.dirname, '../../content/dnd5e');

const write = (file: string, data: unknown) => writeFormatted(file, JSON.stringify(data));

type Named = { name: string; source: string; srd?: boolean; srd52?: boolean };

function importBook(
  book: ClassBook,
  files: FiveToolsClassFile[],
  lists: { optionalfeature: Named[]; feat: Named[] },
) {
  const flag = book === 'srd-5.1' ? 'srd' : 'srd52';
  const inSrd = (kind: 'optionalfeature' | 'feat', name: string, source: string) =>
    lists[kind].some((x) => x.name === name && x.source === source && x[flag] === true);

  const classes = files
    .flatMap((file) => file.class.filter((c) => isSrdClass(c, book)).map((c) => ({ c, file })))
    .sort((a, b) => toClassId(a.c).localeCompare(toClassId(b.c)));
  const specs = CLASS_RESOURCES[book];
  const unknown = Object.keys(specs).filter((id) => !classes.some(({ c }) => toClassId(c) === id));
  if (unknown.length) throw new Error(`${book}: resources for unknown classes: ${unknown}`);

  const converted = classes.map(({ c, file }) => {
    const resources = specs[toClassId(c)];
    if (!resources) throw new Error(`${book}: no resources listed for ${c.name}`);
    return toClass(c, { book, file, inSrd }, resources);
  });
  return {
    data: z.array(classDataSchema).parse(converted.map((c) => c.data)),
    texts: Object.fromEntries(converted.map((c) => [c.data.id, classTextSchema.parse(c.text)])),
  };
}

async function main() {
  const index = await fetchJson<Record<string, string>>('class/index.json');
  const files = await Promise.all(
    Object.values(index).map((file) => fetchJson<FiveToolsClassFile>(`class/${file}`)),
  );
  const [{ optionalfeature }, { feat }] = await Promise.all([
    fetchJson<{ optionalfeature: Named[] }>('optionalfeatures.json'),
    fetchJson<{ feat: Named[] }>('feats.json'),
  ]);

  const counts: string[] = [];
  for (const book of ['srd-5.2', 'srd-5.1'] as const) {
    const { data, texts } = importBook(book, files, { optionalfeature, feat });
    const out = path.join(ROOT, book);
    await write(path.join(out, 'classes.json'), data);
    await write(path.join(out, 'i18n/en/classes.json'), texts);
    const pt = path.join(out, 'i18n/pt/classes.json');
    if (!existsSync(pt)) await write(pt, {});
    counts.push(`SRD ${book.slice(4)} ${data.length}`);
  }
  console.log(`Classes: ${counts.join(', ')}, from 5etools ${VERSION}`);
}

await main();

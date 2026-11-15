/**
 * Sends the class names translated by the Foundry VTT community to Weblate, as suggestions to
 * review there (see NOTICE.md for the sources and their licenses):
 *
 *   npm run content:foundry-class-names              (Weblate key: WEBLATE_TOKEN or ~/.config/weblate)
 *   npm run content:foundry-class-names -- --dry-run (no Weblate: only the files and the report)
 *
 * Only the short names (class, subclass title, features, resources, choices, subclasses), never
 * descriptions. A name already translated in the repository or on Weblate is left alone.
 * Writes what it sends to .foundry-import/<book>/<locale>/classes.json. Nothing in content/
 * changes: accepted names come back in Weblate's pull request.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { writeFormatted } from '../write-formatted';
import { type TextTree, translateClassNames } from './foundry-class-names';
import { type NameIndex, esNameIndex, ptNameIndex } from './foundry-names';
import { fetchDnd5eClassNames, fetchEsClasses, fetchPtCompendia } from './foundry-sources';
import { componentOf, languageOf, readToken, uploadSuggestions } from './weblate-translations';

const ROOT = path.join(import.meta.dirname, '../..');
const OUT = path.join(ROOT, '.foundry-import');
const dryRun = process.argv.includes('--dry-run');

const token = dryRun ? undefined : readToken();
if (!dryRun && !token) {
  throw new Error('Set WEBLATE_TOKEN (or save the key in ~/.config/weblate), or pass --dry-run');
}

const readJson = (file: string): TextTree =>
  existsSync(file) ? (JSON.parse(readFileSync(file, 'utf8')) as TextTree) : {};

const [ptFiles, esEntries, enNameById] = await Promise.all([
  fetchPtCompendia(),
  fetchEsClasses(),
  fetchDnd5eClassNames(),
]);
const pt = ptNameIndex(ptFiles);
const es = esNameIndex(esEntries, enNameById);

const batches: { book: string; locale: 'pt' | 'es'; index: NameIndex }[] = [
  { book: 'srd-5.1', locale: 'pt', index: pt },
  // 5.2 has no pt source: the 5.1 names are reused when the English name didn't change
  { book: 'srd-5.2', locale: 'pt', index: pt },
  { book: 'srd-5.2', locale: 'es', index: es },
];

for (const { book, locale, index } of batches) {
  const i18n = path.join(ROOT, 'content/dnd5e', book, 'i18n');
  const en = readJson(path.join(i18n, 'en/classes.json'));
  const existing = readJson(path.join(i18n, locale, 'classes.json'));
  const { translation, report } = translateClassNames(
    en as Parameters<typeof translateClassNames>[0],
    existing,
    index,
  );
  await writeFormatted(path.join(OUT, book, locale, 'classes.json'), JSON.stringify(translation));

  let sent = '';
  if (token && Object.keys(translation).length) {
    const result = await uploadSuggestions(
      token,
      componentOf(book, 'classes'),
      languageOf(locale),
      translation,
    );
    sent = `, ${result.accepted} sugestões aceitas pelo Weblate, ${result.skipped} puladas`;
  }
  console.log(
    `${book} ${locale}: ${report.translated} traduzidos, ${report.missing.length} sem par, ` +
      `${report.ambiguous.length} ambíguos${sent}`,
  );
  if (report.missing.length) console.log(`  sem par: ${report.missing.join(', ')}`);
  if (report.ambiguous.length) console.log(`  ambíguos: ${report.ambiguous.join(', ')}`);
}

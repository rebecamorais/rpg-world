/**
 * Sends the class names translated by the Foundry VTT community to Crowdin, as unapproved
 * suggestions to review there (see NOTICE.md for the sources and their licenses):
 *
 *   npm run content:foundry-class-names              (needs CROWDIN_PROJECT_ID and CROWDIN_PERSONAL_TOKEN)
 *   npm run content:foundry-class-names -- --dry-run (no Crowdin: only the files and the report)
 *
 * Only the short names (class, subclass title, features, resources, choices, subclasses), never
 * descriptions. A name already translated in the repository or on Crowdin is left alone.
 * Writes what it would send to .foundry-import/<book>/<locale>/classes.json. Nothing in content/
 * changes: approved names come back through the Crowdin sync (/sync-crowdin).
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';

import { writeFormatted } from '../write-formatted';
import {
  CrowdinClient,
  assertIdentifiers,
  identifierOf,
  withoutPaths,
} from './crowdin-translations';
import { type TextTree, translateClassNames } from './foundry-class-names';
import { type NameIndex, esNameIndex, ptNameIndex } from './foundry-names';
import { fetchDnd5eClassNames, fetchEsClasses, fetchPtCompendia } from './foundry-sources';

const ROOT = path.join(import.meta.dirname, '../..');
const OUT = path.join(ROOT, '.foundry-import');
const dryRun = process.argv.includes('--dry-run');

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

let crowdin: CrowdinClient | undefined;
if (!dryRun) {
  const { CROWDIN_PROJECT_ID, CROWDIN_PERSONAL_TOKEN } = process.env;
  if (!CROWDIN_PROJECT_ID || !CROWDIN_PERSONAL_TOKEN) {
    throw new Error('Set CROWDIN_PROJECT_ID and CROWDIN_PERSONAL_TOKEN, or pass --dry-run');
  }
  crowdin = new CrowdinClient(CROWDIN_PROJECT_ID, CROWDIN_PERSONAL_TOKEN);
}

for (const { book, locale, index } of batches) {
  const i18n = path.join(ROOT, 'content/dnd5e', book, 'i18n');
  const en = readJson(path.join(i18n, 'en/classes.json'));
  const existing = readJson(path.join(i18n, locale, 'classes.json'));
  const { translation, report } = translateClassNames(
    en as Parameters<typeof translateClassNames>[0],
    existing,
    index,
  );

  let toSend: TextTree = translation;
  let skipped = 0;
  if (crowdin) {
    const source = `/content/dnd5e/${book}/i18n/en/classes.json`;
    const fileId = await crowdin.fileId(source);
    const languageId = await crowdin.languageId(locale);
    const identifiers = await crowdin.identifiers(fileId);
    assertIdentifiers([...identifiers.values()], en, source);
    const onCrowdin = await crowdin.translatedIdentifiers(fileId, languageId, identifiers);
    toSend = withoutPaths(translation, (p) => {
      const found = onCrowdin.has(identifierOf(p));
      if (found) skipped++;
      return found;
    });
    if (Object.keys(toSend).length) {
      await crowdin.uploadTranslation(fileId, languageId, 'classes.json', toSend);
    }
  }
  await writeFormatted(path.join(OUT, book, locale, 'classes.json'), JSON.stringify(toSend));

  const sent = crowdin ? `, ${report.translated - skipped} enviados` : '';
  const already = crowdin ? `, ${skipped} já no Crowdin` : '';
  console.log(
    `${book} ${locale}: ${report.translated} traduzidos, ${report.missing.length} sem par, ` +
      `${report.ambiguous.length} ambíguos${already}${sent}`,
  );
  if (report.missing.length) console.log(`  sem par: ${report.missing.join(', ')}`);
  if (report.ambiguous.length) console.log(`  ambíguos: ${report.ambiguous.join(', ')}`);
}

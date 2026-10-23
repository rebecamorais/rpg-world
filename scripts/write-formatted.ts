import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { format, resolveConfig } from 'prettier';

/** Writes `source` formatted as the pre-commit hook would, so regenerating it leaves no diff. */
export async function writeFormatted(file: string, source: string): Promise<void> {
  const options = await resolveConfig(file);
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, await format(source, { ...options, filepath: file }));
}

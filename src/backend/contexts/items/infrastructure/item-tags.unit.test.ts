import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { contentIdFromName } from '@shared/content/content-key';
import { tagsOf } from '@shared/content/tags';

const ROOT = join(process.cwd(), 'content/dnd5e');
const BOOKS = ['srd-5.1', 'srd-5.2'];

const readJson = (path: string) =>
  JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>;

/** Every string in a JSON value. */
function strings(value: unknown): string[] {
  if (typeof value === 'string') return [value];
  if (Array.isArray(value)) return value.flatMap(strings);
  if (value && typeof value === 'object') return Object.values(value).flatMap(strings);
  return [];
}

describe('tags {@item} do conteúdo', () => {
  it('lista as tags que não resolvem para um item comum do mesmo livro', () => {
    const resolved: string[] = [];
    const unresolved: string[] = [];

    for (const book of BOOKS) {
      const items = readJson(join(ROOT, book, 'items.json')) as unknown as { id: string }[];
      const ids = new Set((Array.isArray(items) ? items : []).map((i) => i.id));
      for (const file of ['spells', 'conditions', 'items']) {
        const texts = strings(readJson(join(ROOT, book, 'i18n/en', `${file}.json`)));
        for (const { tag, target } of texts.flatMap(tagsOf)) {
          if (tag !== 'item') continue;
          const line = `${book} (${file}): ${target}`;
          (ids.has(contentIdFromName(target)) ? resolved : unresolved).push(line);
        }
      }
    }

    console.info(
      `{@item}: ${resolved.length} resolvem, ${unresolved.length} não resolvem\n${[...new Set(unresolved)].sort().join('\n')}`,
    );
    expect(resolved.length).toBeGreaterThan(0);
  });
});

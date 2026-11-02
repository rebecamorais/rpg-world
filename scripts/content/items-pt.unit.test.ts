import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

type ItemNames = Record<string, { name?: string }>;

const contentDir = join(import.meta.dirname, '..', '..', 'content', 'dnd5e');

function read(book: string, locale: string): ItemNames {
  const file = join(contentDir, book, 'i18n', locale, 'items.json');
  return JSON.parse(readFileSync(file, 'utf8')) as ItemNames;
}

describe.each(['srd-5.1', 'srd-5.2'])('nomes dos itens em português (%s)', (book) => {
  const en = read(book, 'en');
  const pt = read(book, 'pt');

  it('todo item do inglês tem nome em português', () => {
    const missing = Object.keys(en).filter((id) => !pt[id]?.name?.trim());
    expect(missing).toEqual([]);
  });

  it('o português não tem id que o inglês não tenha', () => {
    const extra = Object.keys(pt).filter((id) => !(id in en));
    expect(extra).toEqual([]);
  });
});

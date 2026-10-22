import { parseSpellKey } from '@shared/content/content-key';

/** Rules edition, a label on official content: the source (book) is what identifies an entry. */
export const EDITIONS = ['2014', '2024'] as const;
export type Edition = (typeof EDITIONS)[number];

export const SOURCE_EDITION: Record<string, Edition> = {
  'srd-5.1': '2014',
  'srd-5.2': '2024',
};

export function editionOfKey(key: string): Edition | null {
  const source = parseSpellKey(key)?.source;
  return (source && Object.hasOwn(SOURCE_EDITION, source) && SOURCE_EDITION[source]) || null;
}

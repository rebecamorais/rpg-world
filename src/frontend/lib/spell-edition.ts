import { type Edition, editionOfKey } from '@shared/systems/dnd5e/content/editions';

/** Without a majority (empty spellbook, a tie), the current rules. */
const DEFAULT_EDITION: Edition = '2024';

/** The edition most of the character's spells are from: where the spell list starts. */
export function inferEdition(spellKeys: string[]): Edition {
  const counts = new Map<Edition, number>();
  for (const key of spellKeys) {
    const edition = editionOfKey(key);
    if (edition) counts.set(edition, (counts.get(edition) ?? 0) + 1);
  }
  const [top, second] = [...counts].sort((a, b) => b[1] - a[1]);
  return top && (!second || top[1] > second[1]) ? top[0] : DEFAULT_EDITION;
}

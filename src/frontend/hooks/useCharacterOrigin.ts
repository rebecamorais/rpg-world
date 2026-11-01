import { useTranslations } from 'next-intl';

import { CharacterRace } from '@frontend/constants/character-origins';
import { matchCharacterClass, matchCharacterRace } from '@frontend/lib/character-origin';
import { CharacterClass } from '@frontend/types/spells';

const CLASSES = new Set<string>(Object.values(CharacterClass));
const RACES = new Set<string>(Object.values(CharacterRace));

/**
 * Reads a sheet's class and race. Picked from the list, they are saved as ids ("wizard") and shown
 * in the reader's language; "Other…" saves the player's own text, shown as typed. Sheets from
 * before the lists hold free text ("Mago"), which still matches an option.
 */
export function useCharacterOrigin() {
  const tData = useTranslations('spellsData');
  const tRaces = useTranslations('characterRaces');

  const classLabelOf = (cls: CharacterClass) =>
    tData(`classes.${cls}` as Parameters<typeof tData>[0]);
  const raceLabelOf = (race: CharacterRace) => tRaces(race);

  return {
    classLabelOf,
    raceLabelOf,
    classOf: (text: string | null | undefined) => matchCharacterClass(text, classLabelOf),
    raceOf: (text: string | null | undefined) => matchCharacterRace(text, raceLabelOf),
    /** What to show for the class field: the listed name, or the player's own text. */
    classLabel: (text: string | null | undefined) =>
      text && CLASSES.has(text) ? classLabelOf(text as CharacterClass) : (text ?? ''),
    /** What to show for the race field: the listed name, or the player's own text. */
    raceLabel: (text: string | null | undefined) =>
      text && RACES.has(text) ? raceLabelOf(text as CharacterRace) : (text ?? ''),
  };
}

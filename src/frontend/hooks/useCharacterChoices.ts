import { useTranslations } from 'next-intl';

import {
  CharacterAlignment,
  CharacterBackground,
  CharacterRace,
} from '@frontend/constants/character-choices';
import {
  matchCharacterAlignment,
  matchCharacterBackground,
  matchCharacterClass,
  matchCharacterRace,
} from '@frontend/lib/character-choices';
import { CharacterClass } from '@frontend/types/spells';

const CLASSES = new Set<string>(Object.values(CharacterClass));
const RACES = new Set<string>(Object.values(CharacterRace));

/** The listed option's name when `text` is its id; otherwise the player's own text, as typed. */
const labelFor =
  <T extends string>(ids: Set<string>, labelOf: (id: T) => string) =>
  (text: string | null | undefined) =>
    text && ids.has(text) ? labelOf(text as T) : (text ?? '');

/**
 * Reads a sheet's class, race, background and alignment. Picked from a list, they are saved as ids
 * ("wizard") and shown in the reader's language; "Other…" saves the player's own text, shown as
 * typed. Sheets from before the lists hold free text ("Mago"), which still matches an option.
 */
export function useCharacterChoices() {
  const tData = useTranslations('spellsData');
  const tRaces = useTranslations('characterRaces');
  const tBackgrounds = useTranslations('characterBackgrounds');
  const tAlignments = useTranslations('characterAlignments');

  const classLabelOf = (cls: CharacterClass) =>
    tData(`classes.${cls}` as Parameters<typeof tData>[0]);
  const raceLabelOf = (race: CharacterRace) => tRaces(race);
  const backgroundLabelOf = (background: CharacterBackground) => tBackgrounds(background);
  const alignmentLabelOf = (alignment: CharacterAlignment) => tAlignments(alignment);

  type Text = string | null | undefined;
  return {
    classLabelOf,
    raceLabelOf,
    backgroundLabelOf,
    alignmentLabelOf,
    classOf: (text: Text) => matchCharacterClass(text, classLabelOf),
    raceOf: (text: Text) => matchCharacterRace(text, raceLabelOf),
    backgroundOf: (text: Text) => matchCharacterBackground(text, backgroundLabelOf),
    alignmentOf: (text: Text) => matchCharacterAlignment(text, alignmentLabelOf),
    classLabel: labelFor(CLASSES, classLabelOf),
    raceLabel: labelFor(RACES, raceLabelOf),
  };
}

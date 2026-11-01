import { CharacterClass } from '@frontend/types/spells';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

// Feminine forms (pt, es) the sheet's free text often uses; the labels are the masculine ones
const FEMININE: Partial<Record<CharacterClass, string[]>> = {
  [CharacterClass.BARD]: ['barda'],
  [CharacterClass.CLERIC]: ['cleriga'],
  [CharacterClass.FIGHTER]: ['guerreira'],
  [CharacterClass.MONK]: ['monja'],
  [CharacterClass.PALADIN]: ['paladina'],
  [CharacterClass.RANGER]: ['patrulheira'],
  [CharacterClass.ROGUE]: ['ladina'],
  [CharacterClass.SORCERER]: ['feiticeira', 'hechicera'],
  [CharacterClass.WARLOCK]: ['bruxa', 'bruja'],
  [CharacterClass.WIZARD]: ['maga'],
};

/**
 * The system class named in a character's free-text class ("Wizard", "Mago", "Clérigo 5",
 * "Paladino/Bruxo" → the first one), or null. Accepts the class id, its name in the current
 * locale and the feminine forms ("Maga"), ignoring case and accents.
 */
export function matchCharacterClass(
  text: string | null | undefined,
  labelOf: (cls: CharacterClass) => string,
): CharacterClass | null {
  if (!text) return null;

  const names = new Map<string, CharacterClass>();
  for (const cls of Object.values(CharacterClass)) {
    names.set(cls, cls);
    names.set(normalize(labelOf(cls)), cls);
    for (const form of FEMININE[cls] ?? []) names.set(form, cls);
  }

  for (const word of normalize(text).split(/[^\p{L}]+/u)) {
    const cls = names.get(word);
    if (cls) return cls;
  }
  return null;
}

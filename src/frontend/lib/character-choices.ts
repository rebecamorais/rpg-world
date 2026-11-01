import {
  CharacterAlignment,
  CharacterBackground,
  CharacterRace,
} from '@frontend/constants/character-choices';
import { CharacterClass } from '@frontend/types/spells';

/** Lowercase, no accents, words separated by single spaces: "Meio-Elfo" → "meio elfo". */
function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .split(/[^\p{L}]+/u)
    .filter(Boolean)
    .join(' ');
}

/**
 * The option named in a free-text field, or null. Accepts the id, the name in the current locale
 * and `extra` forms, ignoring case and accents. The whole text is tried first ("Meio-Elfo" is a
 * half-elf, not an elf); then each word, in order ("Paladino/Bruxo" → paladin, "Mago 5" → wizard).
 */
function matchOption<T extends string>(
  text: string | null | undefined,
  options: readonly T[],
  labelOf: (option: T) => string,
  extra: Partial<Record<T, string[]>> = {},
  { wholeOnly = false }: { wholeOnly?: boolean } = {},
): T | null {
  if (!text) return null;

  const names = new Map<string, T>();
  for (const option of options) {
    names.set(normalize(option), option);
    names.set(normalize(labelOf(option)), option);
    for (const form of extra[option] ?? []) names.set(form, option);
  }

  const whole = normalize(text);
  if (wholeOnly) return names.get(whole) ?? null;
  return (
    names.get(whole) ??
    whole.split(' ').reduce<T | null>((found, word) => found ?? names.get(word) ?? null, null)
  );
}

// Feminine forms (pt, es) the sheet's free text often uses; the labels are the masculine ones
const FEMININE_CLASSES: Partial<Record<CharacterClass, string[]>> = {
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

const FEMININE_RACES: Partial<Record<CharacterRace, string[]>> = {
  [CharacterRace.DRAGONBORN]: ['draconata'],
  [CharacterRace.DWARF]: ['ana', 'enana'],
  [CharacterRace.ELF]: ['elfa'],
  [CharacterRace.GNOME]: ['gnoma'],
  [CharacterRace.HALF_ELF]: ['meio elfa', 'semielfa'],
  [CharacterRace.HALF_ORC]: ['meio orc', 'semiorca'],
  [CharacterRace.HUMAN]: ['humana'],
  [CharacterRace.ORC]: ['orca'],
};

/** The system class in a character's class field ("wizard", "Mago", "Clériga 5"), or null. */
export function matchCharacterClass(
  text: string | null | undefined,
  labelOf: (cls: CharacterClass) => string,
): CharacterClass | null {
  return matchOption(text, Object.values(CharacterClass), labelOf, FEMININE_CLASSES);
}

/** The listed race in a character's race field ("elf", "Elfa", "Meio-Elfo"), or null. */
export function matchCharacterRace(
  text: string | null | undefined,
  labelOf: (race: CharacterRace) => string,
): CharacterRace | null {
  return matchOption(text, Object.values(CharacterRace), labelOf, FEMININE_RACES);
}

const FEMININE_BACKGROUNDS: Partial<Record<CharacterBackground, string[]>> = {
  [CharacterBackground.ACOLYTE]: ['acolita'],
  [CharacterBackground.CRIMINAL]: ['criminosa'],
  [CharacterBackground.SAGE]: ['sabia'],
};

// Abbreviations (en, pt) and the forms without "e" ("Leal Bom")
const ALIGNMENT_FORMS: Record<CharacterAlignment, string[]> = {
  [CharacterAlignment.LAWFUL_GOOD]: ['lg', 'lb', 'leal bom'],
  [CharacterAlignment.NEUTRAL_GOOD]: ['ng', 'nb', 'neutro bom'],
  [CharacterAlignment.CHAOTIC_GOOD]: ['cg', 'cb', 'caotico bom'],
  [CharacterAlignment.LAWFUL_NEUTRAL]: ['ln', 'leal neutro'],
  [CharacterAlignment.NEUTRAL]: ['n', 'true neutral', 'neutro verdadeiro'],
  [CharacterAlignment.CHAOTIC_NEUTRAL]: ['cn', 'caotico neutro'],
  [CharacterAlignment.LAWFUL_EVIL]: ['le', 'lm', 'leal mau'],
  [CharacterAlignment.NEUTRAL_EVIL]: ['ne', 'nm', 'neutro mau'],
  [CharacterAlignment.CHAOTIC_EVIL]: ['ce', 'cm', 'caotico mau'],
};

/** The listed background in a character's background field ("sage", "Sábio"), or null. */
export function matchCharacterBackground(
  text: string | null | undefined,
  labelOf: (background: CharacterBackground) => string,
): CharacterBackground | null {
  return matchOption(text, Object.values(CharacterBackground), labelOf, FEMININE_BACKGROUNDS);
}

/**
 * The alignment in a character's alignment field ("neutral-good", "Neutro e Bom", "NG"), or null.
 * Only the whole text counts: word by word, "Neutro e Mau" would be "Neutro".
 */
export function matchCharacterAlignment(
  text: string | null | undefined,
  labelOf: (alignment: CharacterAlignment) => string,
): CharacterAlignment | null {
  return matchOption(text, Object.values(CharacterAlignment), labelOf, ALIGNMENT_FORMS, {
    wholeOnly: true,
  });
}

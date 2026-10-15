import { CharacterClass } from '@frontend/types/spells';

function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();
}

/**
 * The system class named in a character's free-text class ("Wizard", "Mago", "Clérigo 5",
 * "Paladino/Bruxo" → the first one), or null. Accepts the class id and its name in the
 * current locale, ignoring case and accents.
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
  }

  for (const word of normalize(text).split(/[^\p{L}]+/u)) {
    const cls = names.get(word);
    if (cls) return cls;
  }
  return null;
}

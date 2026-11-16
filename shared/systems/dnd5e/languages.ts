/*
 * The languages of the SRD 5.1, by id. The sheet stores the id; the name is only the interface's,
 * in `messages` under `proficiencies.languages.<id>`. Druidic and Thieves' Cant are secret: a class
 * feature gives them (see `proficiencies.ts`), but the player can still add them by hand.
 */

const LANGUAGE_GROUPS = {
  standard: ['common', 'dwarvish', 'elvish', 'giant', 'gnomish', 'goblin', 'halfling', 'orc'],
  exotic: [
    'abyssal',
    'celestial',
    'draconic',
    'deep-speech',
    'infernal',
    'primordial',
    'sylvan',
    'undercommon',
  ],
  secret: ['druidic', 'thieves-cant'],
} as const;

export type LanguageId = (typeof LANGUAGE_GROUPS)[keyof typeof LANGUAGE_GROUPS][number];

/** Every language, standard first, then exotic, then the secret ones. */
export const LANGUAGE_IDS: readonly LanguageId[] = Object.values(LANGUAGE_GROUPS).flat();

export const isLanguageId = (id: string): id is LanguageId =>
  (LANGUAGE_IDS as readonly string[]).includes(id);

import {
  type ClassChoiceSelections,
  acceptedSelections,
} from '@shared/systems/dnd5e/class-choices';
import { classDefaults } from '@shared/systems/dnd5e/class-defaults';
import type { ClassContent } from '@shared/systems/dnd5e/class-resources';
import { ATTRIBUTE_KEYS, SKILL_KEYS } from '@shared/systems/dnd5e/constants';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import { CharacterKind } from '../../domain/entity/Character';
import {
  AttributeKey,
  CharacterSkill,
  DnD5eCharacter,
  SkillKey,
} from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

export interface CreateCharacterInput {
  id?: string;
  name: string;
  ownerUsername: string;
  system?: string;
  edition?: Edition;
  /** A class id from the list (`bard`) or the player's own text. */
  class?: string;
  race?: string;
  level?: number;
  /** npc: one of the GM's enemy sheets. */
  kind?: CharacterKind;
  /** Picks for the class's choices, by the choice's identity (`2014/bard/skills`). */
  classChoices?: Record<string, string[]>;
}

/** The official class content the defaults come from; the classes context's catalog is one. */
export interface ClassLookup {
  resources(edition: Edition, classId: string): ClassContent | null;
}

// What a sheet with no class to follow starts with, as before classes filled the sheet
const HP_WITHOUT_CLASS = 10;
const SKILLS = new Set<string>(SKILL_KEYS);

export class CreateCharacterUseCase {
  constructor(
    private repository: CharacterRepo,
    private readonly classes?: ClassLookup,
  ) {}

  /**
   * With the 2014 edition and an SRD class, the sheet starts with the level 1 hit points and the
   * skills picked for the class, kept under the choice's identity. Only picks the class lists
   * count, each once and up to what it asks for; the rest are dropped, and too few never stop the
   * creation. Everything else the class gives (saving throws, hit die) is not stored: it follows
   * the class. Without an edition, on 2024 or with the player's own class, the sheet is as before.
   */
  async execute(input: CreateCharacterInput): Promise<DnD5eCharacter> {
    if (!input.name || input.name.trim() === '') {
      throw new CharacterError(CharacterErrorCodes.CREATE_NAME_REQUIRED);
    }

    // Simplificação provisória: Assumindo que o jogo é D&D 5e
    // Um factory pattern genérico ersolve disso depois.
    const attributes = new Attributes(); // Valores base 10
    const level = input.level || 1;
    const classStr = input.class || '';

    const content =
      input.edition && classStr ? (this.classes?.resources(input.edition, classStr) ?? null) : null;
    const scores = Object.fromEntries(
      ATTRIBUTE_KEYS.map((key) => [key, attributes.get(key)]),
    ) as Record<AttributeKey, number>;
    const defaults = classDefaults(input.edition, content, scores);
    // Level 1's: later levels are the progression's (phase 4), never guessed here
    const hpMax = defaults && level === 1 ? defaults.hpMax : HP_WITHOUT_CLASS;
    const classChoices = defaults ? acceptedSelections(defaults.choices, input.classChoices) : {};

    const character = new DnD5eCharacter({
      id: input.id || crypto.randomUUID(),
      name: input.name.trim(),
      ownerUsername: input.ownerUsername,
      attributes,
      hp: new HealthPoints(hpMax, hpMax),
      level,
      classStr,
      race: input.race || '',
      kind: input.kind ?? 'pc',
      edition: input.edition,
      skills: pickedSkills(classChoices),
      ...(Object.keys(classChoices).length > 0 && { classChoices }),
    });

    await this.repository.save(character);

    return character;
  }
}

/** The picked skills, marked proficient on the sheet like any skill marked by hand. */
function pickedSkills(
  selections: ClassChoiceSelections,
): Partial<Record<SkillKey, CharacterSkill>> {
  const picked = Object.values(selections)
    .flat()
    .filter((id): id is SkillKey => SKILLS.has(id));
  return Object.fromEntries(picked.map((key) => [key, { isProficient: true }]));
}

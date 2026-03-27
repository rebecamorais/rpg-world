import { applyUpdates } from '@backend/shared/infrastructure/helpers/update-fields';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import {
  AttributeKey,
  CharacterSkill,
  DnD5eCharacter,
  SkillKey,
} from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

export interface CharacterUpdates {
  name?: string;
  avatarUrl?: string;
  accentColor?: string;
  class?: string;
  race?: string;
  level?: number;
  ac?: number;
  speed?: number;
  initiative?: number;
  hpCurrent?: number;
  hpMax?: number;
  hpTemp?: number;
  attributes?: Record<AttributeKey, number>;
  skills?: Partial<Record<SkillKey, CharacterSkill>>;
  savingThrowProficiencies?: Record<AttributeKey, boolean>;
  passivePerception?: number;
  subclass?: string;
  background?: string;
  alignment?: string;
  xp?: number;
  hitDice?: { total: string; current: number };
  deathSaves?: { successes: number; failures: number };
  spellcastingSystem?: 'slots' | 'points';
  spellcastingAbility?: AttributeKey;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spellSlots?: Record<string, { max: number; used: number }>;
  spellPoints?: { max: number; current: number };
  coins?: { cp: number; sp: number; ep: number; gp: number; pp: number };
}

export class UpdateCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute({
    id,
    ownerUsername,
    updates,
  }: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }): Promise<DnD5eCharacter> {
    const character = await this.repository.findById(id);

    if (!character) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_NOT_FOUND);
    }

    if (character.ownerUsername !== ownerUsername) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_UNAUTHORIZED);
    }

    if (!(character instanceof DnD5eCharacter)) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_SYSTEM_NOT_SUPPORTED);
    }

    const {
      level,
      hpCurrent,
      hpMax,
      attributes,
      skills,
      savingThrowProficiencies,
      ...simpleUpdates
    } = updates;

    // Aplica atualizações diretas para campos simples
    applyUpdates(character, simpleUpdates);

    // Lógica customizada para campos com regras de negócio
    if (level !== undefined) character.level = Math.max(1, level);

    if (hpCurrent !== undefined || hpMax !== undefined) {
      const currentHp = hpCurrent !== undefined ? hpCurrent : character.hp.current;
      const maxHp = hpMax !== undefined ? hpMax : character.hp.max;
      character.hp = new HealthPoints(currentHp, maxHp);
    }

    if (attributes) {
      for (const [key, value] of Object.entries(attributes)) {
        character.attributes.set(key as AttributeKey, value as number);
      }
    }

    if (skills) {
      character.skills = { ...character.skills, ...skills };
    }

    if (savingThrowProficiencies !== undefined) {
      character.savingThrowProficiencies = savingThrowProficiencies as Record<
        AttributeKey,
        boolean
      >;
    }

    await this.repository.save(character);

    return character;
  }
}

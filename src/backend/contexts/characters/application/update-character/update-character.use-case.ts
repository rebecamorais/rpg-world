import { applyUpdates } from '@backend/shared/application/apply-updates';
import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import { CharacterError, CharacterErrorCodes } from '../../domain/CharacterError';
import {
  AttributeKey,
  CharacterSkill,
  DnD5eCharacter,
  SkillKey,
} from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { findOwnedCharacter } from '../find-owned-character';
import { removeCharacterAvatar } from '../upload-avatar/character-avatar-file';

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
  attributes?: Partial<Record<AttributeKey, number>>;
  skills?: Partial<Record<SkillKey, CharacterSkill>>;
  savingThrowProficiencies?: Partial<Record<AttributeKey, boolean>>;
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

// Campos copiados diretamente. Qualquer chave fora desta lista (id, ownerUsername, system...)
// é ignorada para impedir mass-assignment vindo do cliente.
const SIMPLE_FIELDS = [
  'name',
  'avatarUrl',
  'accentColor',
  'class',
  'race',
  'ac',
  'speed',
  'initiative',
  'hpTemp',
  'passivePerception',
  'subclass',
  'background',
  'alignment',
  'xp',
  'hitDice',
  'deathSaves',
  'spellcastingSystem',
  'spellcastingAbility',
  'spellSaveDc',
  'spellAttackBonus',
  'spellSlots',
  'spellPoints',
  'coins',
] as const satisfies readonly (keyof CharacterUpdates & keyof DnD5eCharacter)[];

type SimpleField = (typeof SIMPLE_FIELDS)[number];

const pickSimpleUpdates = (updates: CharacterUpdates): Partial<Pick<DnD5eCharacter, SimpleField>> =>
  Object.fromEntries(
    SIMPLE_FIELDS.filter((key) => Object.hasOwn(updates, key)).map((key) => [key, updates[key]]),
  );

export class UpdateCharacterUseCase {
  constructor(
    private repository: CharacterRepo,
    private readonly storageRepository?: StorageRepository,
  ) {}

  async execute({
    id,
    ownerUsername,
    updates,
  }: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
  }): Promise<DnD5eCharacter> {
    const character = await findOwnedCharacter(this.repository, id, ownerUsername, 'write', {
      notFound: CharacterErrorCodes.UPDATE_NOT_FOUND,
      forbidden: CharacterErrorCodes.UPDATE_UNAUTHORIZED,
    });

    if (!(character instanceof DnD5eCharacter)) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_SYSTEM_NOT_SUPPORTED);
    }

    const { level, hpCurrent, hpMax, attributes, skills, savingThrowProficiencies } = updates;
    const previousAvatarUrl = character.avatarUrl;

    // Aplica atualizações diretas para campos simples
    applyUpdates(character, pickSimpleUpdates(updates));

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

    if (this.storageRepository && updates.avatarUrl !== undefined) {
      await removeCharacterAvatar(this.storageRepository, character, previousAvatarUrl);
    }

    return character;
  }
}

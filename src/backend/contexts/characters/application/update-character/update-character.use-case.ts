import { applyUpdates } from '@backend/shared/application/apply-updates';
import { StorageRepository } from '@backend/shared/domain/StorageRepository';

import type { ResourceState } from '@shared/systems/dnd5e/class-resources';
import type { Edition } from '@shared/systems/dnd5e/content/editions';
import { type HitDice, type LegacyHitDice, readHitDice } from '@shared/systems/dnd5e/hit-dice';
import type { SavedProficiencies } from '@shared/systems/dnd5e/proficiencies';

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
import { removeCharacterSheetBackground } from '../sheet-background/sheet-background-file';
import { removeCharacterAvatar } from '../upload-avatar/character-avatar-file';

export interface CharacterUpdates {
  name?: string;
  avatarUrl?: string;
  sheetBackgroundUrl?: string;
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
  /** The whole map, as the sheet has it (like the saving throws). */
  proficiencies?: SavedProficiencies;
  subclass?: string;
  background?: string;
  alignment?: string;
  xp?: number;
  hitDice?: HitDice | LegacyHitDice;
  deathSaves?: { successes: number; failures: number };
  spellcastingSystem?: 'slots' | 'points';
  spellcastingAbility?: AttributeKey;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spellSlots?: Record<string, { max: number; used: number }>;
  spellPoints?: { max: number; current: number };
  edition?: Edition;
  resources?: Record<string, ResourceState>;
}

const MAX_RESOURCES = 200;

// The save is a compare-and-set on the row: when another write lands between the read and the
// write (often game state, like the GM's damage), it reads again and reapplies, a few times
const MAX_ATTEMPTS = 3;

// Campos copiados diretamente. Qualquer chave fora desta lista (id, ownerUsername, system...)
// é ignorada para impedir mass-assignment vindo do cliente.
const SIMPLE_FIELDS = [
  'name',
  'avatarUrl',
  'sheetBackgroundUrl',
  'accentColor',
  'class',
  'race',
  'ac',
  'speed',
  'initiative',
  'hpTemp',
  'passivePerception',
  'proficiencies',
  'subclass',
  'background',
  'alignment',
  'xp',
  'deathSaves',
  'spellcastingSystem',
  'spellcastingAbility',
  'spellSaveDc',
  'spellAttackBonus',
  'spellSlots',
  'spellPoints',
  'edition',
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

  /**
   * Applies `updates` on top of the stored character. With `revision` (the one the client last
   * saw), a sheet whose draft fields changed since is a conflict (409 with the current revision)
   * and nothing is written; game state (HP, spent slots...) does not move the revision, so it
   * never conflicts. Without it (the app published before revisions), the changes go on top of
   * whatever is there now.
   */
  async execute({
    id,
    ownerUsername,
    updates,
    revision,
  }: {
    id: string;
    ownerUsername: string;
    updates: CharacterUpdates;
    revision?: number;
  }): Promise<DnD5eCharacter> {
    for (let attempt = 1; ; attempt++) {
      const character = await this.load(id, ownerUsername);
      if (revision !== undefined && revision !== character.revision) {
        throw conflict(character.revision);
      }

      const previous = { avatarUrl: character.avatarUrl, background: character.sheetBackgroundUrl };
      this.apply(character, updates);

      let saved = await this.repository.saveIfUnchanged(character);
      if (!saved && attempt >= MAX_ATTEMPTS) {
        if (revision !== undefined) {
          // Only a client that sent a revision can handle a 409
          const current = await this.repository.findById(id);
          if (!current) throw new CharacterError(CharacterErrorCodes.UPDATE_NOT_FOUND);
          throw conflict(current.revision);
        }
        // The published app has no 409 handling: keep its old last-write-wins save
        await this.repository.save(character);
        // The upsert answers nothing: read back the revision the trigger left
        character.revision = (await this.repository.findById(id))?.revision ?? character.revision;
        saved = true;
      }
      if (!saved) continue;

      await this.removeReplacedFiles(character, updates, previous);
      return character;
    }
  }

  private async load(id: string, ownerUsername: string): Promise<DnD5eCharacter> {
    const character = await findOwnedCharacter(this.repository, id, ownerUsername, 'write', {
      notFound: CharacterErrorCodes.UPDATE_NOT_FOUND,
      forbidden: CharacterErrorCodes.UPDATE_UNAUTHORIZED,
    });

    if (!(character instanceof DnD5eCharacter)) {
      throw new CharacterError(CharacterErrorCodes.UPDATE_SYSTEM_NOT_SUPPORTED);
    }
    return character;
  }

  private apply(character: DnD5eCharacter, updates: CharacterUpdates): void {
    const {
      level,
      hitDice,
      hpCurrent,
      hpMax,
      attributes,
      skills,
      savingThrowProficiencies,
      resources,
    } = updates;

    // Aplica atualizações diretas para campos simples
    applyUpdates(character, pickSimpleUpdates(updates));

    // Lógica customizada para campos com regras de negócio
    if (level !== undefined) character.level = Math.max(1, level);

    // A client from before 2026-11 still sends the dice left: the sheet only keeps what was spent,
    // counted at the level being saved
    if (hitDice) character.hitDice = readHitDice(hitDice, character.level);

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

    if (resources) {
      // Merged key by key. A `custom:` key sent without its box removes it: that is how a box of
      // the player's own is deleted, since a key left out of the update means "unchanged"
      const merged = Object.fromEntries(
        Object.entries({ ...character.resources, ...resources }).filter(
          ([key, state]) => !key.startsWith('custom:') || state.custom,
        ),
      );
      // Class boxes are never deleted, so cap the stored map
      if (Object.keys(merged).length > MAX_RESOURCES) {
        throw new CharacterError(CharacterErrorCodes.RESOURCE_LIMIT);
      }
      character.resources = merged;
    }

    if (savingThrowProficiencies !== undefined) {
      // The whole map, as the sheet has it: an ability left out goes back to following the class
      character.savingThrowProficiencies = { ...savingThrowProficiencies };
    }
  }

  private async removeReplacedFiles(
    character: DnD5eCharacter,
    updates: CharacterUpdates,
    previous: { avatarUrl?: string; background?: string },
  ): Promise<void> {
    if (this.storageRepository && updates.avatarUrl !== undefined) {
      await removeCharacterAvatar(this.storageRepository, character, previous.avatarUrl);
    }

    if (this.storageRepository && updates.sheetBackgroundUrl !== undefined) {
      await removeCharacterSheetBackground(this.storageRepository, character, previous.background);
    }
  }
}

/** 409 with what the client needs to reload: `{ code: 'conflict', revision }`. */
const conflict = (revision: number) =>
  new CharacterError(CharacterErrorCodes.CONFLICT, { code: 'conflict', revision });

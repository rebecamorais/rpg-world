import {
  AttributeKey,
  CharacterSkill,
  DnD5eCharacter,
  SkillKey,
} from '../../domain/entity/DnD5eCharacter';
import { CharacterRepo } from '../../domain/repository';
import { HealthPoints } from '../../domain/value-object/HealthPoints';

export interface UpdateCharacterInput {
  id: string;
  ownerUsername: string;
  updates: {
    name?: string;
    characterClass?: string;
    race?: string;
    level?: number;
    ac?: number;
    speed?: number;
    initiative?: number;
    hpCurrent?: number;
    hpMax?: number;
    attributes?: Record<AttributeKey, number>;
    skills?: Partial<Record<SkillKey, CharacterSkill>>;
    savingThrowProficiencies?: Record<AttributeKey, boolean>;
    spellsKnown?: string[];
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
  };
}

export class UpdateCharacterUseCase {
  constructor(private repository: CharacterRepo) {}

  async execute(input: UpdateCharacterInput): Promise<DnD5eCharacter> {
    const character = await this.repository.findById(input.id);

    if (!character) {
      throw new Error('Personagem não encontrado.');
    }

    if (character.ownerUsername !== input.ownerUsername) {
      throw new Error('Não autorizado a modificar este personagem.');
    }

    if (!(character instanceof DnD5eCharacter)) {
      throw new Error('Suporte apenas para D&D 5e no momento.');
    }

    const u = input.updates;

    if (u.name !== undefined) character.name = u.name;
    if (u.characterClass !== undefined)
      character.characterClass = u.characterClass;
    if (u.race !== undefined) character.race = u.race;
    if (u.level !== undefined) character.level = Math.max(1, u.level);
    if (u.ac !== undefined) character.ac = u.ac;
    if (u.speed !== undefined) character.speed = u.speed;
    if (u.initiative !== undefined) character.initiative = u.initiative;
    if (u.passivePerception !== undefined)
      character.passivePerception = u.passivePerception;

    if (u.hpCurrent !== undefined || u.hpMax !== undefined) {
      const currentHp =
        u.hpCurrent !== undefined ? u.hpCurrent : character.hp.status.current;
      const maxHp = u.hpMax !== undefined ? u.hpMax : character.hp.status.max;
      character.hp = new HealthPoints(currentHp, maxHp);
    }

    if (u.attributes) {
      for (const [key, value] of Object.entries(u.attributes)) {
        character.attributes.set(key as AttributeKey, value as number);
      }
    }

    if (u.skills) {
      character.skills = { ...character.skills, ...u.skills };
    }

    if (u.savingThrowProficiencies !== undefined) {
      character.savingThrowProficiencies = u.savingThrowProficiencies as Record<
        AttributeKey,
        boolean
      >;
    }

    if (u.spellsKnown !== undefined) {
      character.spellsKnown = u.spellsKnown;
    }

    // Novas propriedades
    if (u.subclass !== undefined) character.subclass = u.subclass;
    if (u.background !== undefined) character.background = u.background;
    if (u.alignment !== undefined) character.alignment = u.alignment;
    if (u.xp !== undefined) character.xp = u.xp;
    if (u.hitDice !== undefined) character.hitDice = u.hitDice;
    if (u.deathSaves !== undefined) character.deathSaves = u.deathSaves;
    if (u.spellcastingSystem !== undefined)
      character.spellcastingSystem = u.spellcastingSystem;
    if (u.spellcastingAbility !== undefined)
      character.spellcastingAbility = u.spellcastingAbility as AttributeKey;
    if (u.spellSaveDc !== undefined) character.spellSaveDc = u.spellSaveDc;
    if (u.spellAttackBonus !== undefined)
      character.spellAttackBonus = u.spellAttackBonus;
    if (u.spellSlots !== undefined) character.spellSlots = u.spellSlots;
    if (u.spellPoints !== undefined) character.spellPoints = u.spellPoints;
    if (u.coins !== undefined) character.coins = u.coins;

    await this.repository.save(character);

    return character;
  }
}

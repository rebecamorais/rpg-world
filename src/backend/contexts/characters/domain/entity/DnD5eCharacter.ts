import { Lore } from '@backend/contexts/lore';

import { Attributes } from '../value-object/Attributes';
import { HealthPoints } from '../value-object/HealthPoints';
import { Character } from './Character';

export interface Spell {
  id: string;
  externalIndex?: string;
  level: number;
  school: string;
  castingTime: string;
  castingValue?: number | null;

  // Structured Mechanics
  rangeValue?: number | null;
  rangeUnit?: string | null;
  durationValue?: number | null;
  durationUnit?: string | null;

  concentration: boolean;
  ritual: boolean;
  components: string[];
  classes: string[];
  name: string;
  description: string;
  higherLevel?: string | null;
  material?: string | null;
}

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export type SkillKey =
  | 'Acrobatics'
  | 'Animal Handling'
  | 'Arcana'
  | 'Athletics'
  | 'Deception'
  | 'History'
  | 'Insight'
  | 'Intimidation'
  | 'Investigation'
  | 'Medicine'
  | 'Nature'
  | 'Perception'
  | 'Performance'
  | 'Persuasion'
  | 'Religion'
  | 'Sleight of Hand'
  | 'Stealth'
  | 'Survival';

export interface CharacterSkill {
  isProficient: boolean;
  expertise?: boolean;
}

export interface DnD5eCharacterOptions {
  id: string;
  name: string;
  ownerUsername: string;
  attributes: Attributes;
  hp: HealthPoints;
  level: number;
  classStr?: string;
  race?: string;
  ac?: number;
  speed?: number;
  initiative?: number;
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
  hpTemp?: number;
  lore?: Lore;
  accentColor?: string;
  avatarUrl?: string;
}

export class DnD5eCharacter extends Character {
  public class: string;
  public race: string;
  public ac: number;
  public speed: number;
  public initiative: number;
  public hpTemp: number;
  public skills: Partial<Record<SkillKey, CharacterSkill>>;
  public savingThrowProficiencies: Record<AttributeKey, boolean>;
  public passivePerception: number;

  public subclass?: string;
  public background?: string;
  public alignment?: string;
  public xp?: number;

  public hitDice?: { total: string; current: number };
  public deathSaves?: { successes: number; failures: number };

  public spellcastingSystem?: 'slots' | 'points';
  public spellcastingAbility?: AttributeKey;
  public spellSaveDc?: number;
  public spellAttackBonus?: number;
  public spellSlots?: Record<string, { max: number; used: number }>;
  public spellPoints?: { max: number; current: number };

  public coins?: { cp: number; sp: number; ep: number; gp: number; pp: number };

  constructor(options: DnD5eCharacterOptions) {
    super(
      options.id,
      options.name,
      'DnD_5e',
      options.ownerUsername,
      options.attributes,
      options.hp,
      options.level,
      options.lore ?? Lore.empty(),
      options.accentColor,
      options.avatarUrl,
    );
    this.class = options.classStr ?? '';
    this.race = options.race ?? '';
    this.ac = options.ac ?? 10;
    this.speed = options.speed ?? 30;
    this.initiative = options.initiative ?? 0;
    this.hpTemp = options.hpTemp ?? 0;
    this.skills = options.skills ?? {};
    this.savingThrowProficiencies = this.normalizeSavingThrows(
      options.savingThrowProficiencies ?? {},
    );
    this.passivePerception = options.passivePerception ?? 10;
    this.subclass = options.subclass;
    this.background = options.background;
    this.alignment = options.alignment;
    this.xp = options.xp;
    this.hitDice = options.hitDice;
    this.deathSaves = options.deathSaves;
    this.spellcastingSystem = options.spellcastingSystem;
    this.spellcastingAbility = options.spellcastingAbility;
    this.spellSaveDc = options.spellSaveDc;
    this.spellAttackBonus = options.spellAttackBonus;
    this.spellSlots = options.spellSlots;
    this.spellPoints = options.spellPoints;
    this.coins = options.coins;
  }

  private normalizeSavingThrows(
    saves: Partial<Record<AttributeKey, boolean>>,
  ): Record<AttributeKey, boolean> {
    const defaultSaves: Record<AttributeKey, boolean> = {
      STR: false,
      DEX: false,
      CON: false,
      INT: false,
      WIS: false,
      CHA: false,
    };
    return { ...defaultSaves, ...saves };
  }

  // Domain Rules for D&D 5e
  getModifier(attributeKey: AttributeKey): number {
    const val = this.attributes.get(attributeKey);
    return Math.floor((val - 10) / 2);
  }

  get proficiencyBonus(): number {
    return 2 + Math.floor((this.level - 1) / 4);
  }

  calculateSkillValue(skillKey: SkillKey, relatedAttribute: AttributeKey): number {
    const mod = this.getModifier(relatedAttribute);
    const skill = this.skills[skillKey];
    if (!skill?.isProficient) return mod;

    const bonus = skill.expertise ? this.proficiencyBonus * 2 : this.proficiencyBonus;
    return mod + bonus;
  }

  calculateSavingThrow(attributeKey: AttributeKey): number {
    const mod = this.getModifier(attributeKey);
    const isProficient = this.savingThrowProficiencies[attributeKey];
    const pb = isProficient ? this.proficiencyBonus : 0;
    return mod + pb;
  }

  getCombatStats(): Record<string, unknown> {
    return {
      ac: this.ac,
      hpCurrent: this.hp.current,
      hpMax: this.hp.max,
      hpTemp: this.hpTemp,
      speed: this.speed,
      initiative: this.initiative + this.getModifier('DEX'), // Initiative normally is just DEX mod, plus possible bonuses
      proficiencyBonus: this.proficiencyBonus,
    };
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      system: this.system,
      ownerUsername: this.ownerUsername,
      level: this.level,
      avatarUrl: this.avatarUrl,
      accentColor: this.accentColor,
      attributes: this.attributes.getAll(),
      hpCurrent: this.hp.current,
      hpMax: this.hp.max,
      hpTemp: this.hpTemp,
      class: this.class,
      race: this.race,
      ac: this.ac,
      speed: this.speed,
      initiative: this.initiative,
      passivePerception: this.passivePerception,
      skills: this.skills,
      savingThrowProficiencies: this.savingThrowProficiencies,

      subclass: this.subclass,
      background: this.background,
      alignment: this.alignment,
      xp: this.xp,
      hitDice: this.hitDice,
      deathSaves: this.deathSaves,

      // Lore & Identity
      ...this.lore.toJSON(),

      spellcastingSystem: this.spellcastingSystem,
      spellcastingAbility: this.spellcastingAbility,
      spellSaveDc: this.spellSaveDc,
      spellAttackBonus: this.spellAttackBonus,
      spellSlots: this.spellSlots,
      spellPoints: this.spellPoints,

      coins: this.coins,
    };
  }
}

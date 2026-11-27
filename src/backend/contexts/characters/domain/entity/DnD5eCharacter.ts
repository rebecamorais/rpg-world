import { Lore } from '@backend/contexts/lore/domain/Lore';

import type { ClassChoiceSelections } from '@shared/systems/dnd5e/class-choices';
import type { ResourceState } from '@shared/systems/dnd5e/class-resources';
import type { SkillKey } from '@shared/systems/dnd5e/constants/skill';
import type { Edition } from '@shared/systems/dnd5e/content/editions';
import type { HitDice } from '@shared/systems/dnd5e/hit-dice';
import type { SavedProficiencies } from '@shared/systems/dnd5e/proficiencies';
import type { AttributeKey } from '@shared/systems/dnd5e/types';
import { SYSTEMS } from '@shared/systems/registry';

import { Attributes } from '../value-object/Attributes';
import { HealthPoints } from '../value-object/HealthPoints';
import { Character, CharacterKind } from './Character';

// Same keys the sheet stores and the shared rules use (e.g. 'ACROBATICS'), so the domain
// can't drift from the persisted data.
export type { AttributeKey, SkillKey };

export interface CharacterSkill {
  isProficient: boolean;
  expertise?: boolean;
}

export interface DnD5eCharacterOptions {
  id: string;
  kind?: CharacterKind;
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
  proficiencies?: SavedProficiencies;
  subclass?: string;
  background?: string;
  alignment?: string;
  xp?: number;
  hitDice?: HitDice;
  deathSaves?: { successes: number; failures: number };
  spellcastingSystem?: 'slots' | 'points';
  spellcastingAbility?: AttributeKey;
  spellSaveDc?: number;
  spellAttackBonus?: number;
  spellSlots?: Record<string, { max: number; used: number }>;
  spellPoints?: { max: number; current: number };
  edition?: Edition;
  resources?: Record<string, ResourceState>;
  classChoices?: ClassChoiceSelections;
  dismissedChoices?: string[];
  hpTemp?: number;
  lore?: Lore;
  accentColor?: string;
  avatarUrl?: string;
  sheetBackgroundUrl?: string;
}

export class DnD5eCharacter extends Character {
  public class: string;
  public race: string;
  public ac: number;
  public speed: number;
  public initiative: number;
  public hpTemp: number;
  public skills: Partial<Record<SkillKey, CharacterSkill>>;
  /** Only the saving throws set by hand, on or off; an ability left out follows the class. */
  public savingThrowProficiencies: Partial<Record<AttributeKey, boolean>>;
  public passivePerception: number;
  /** Only what the player added, wrote or turned off; absent until they change one. */
  public proficiencies?: SavedProficiencies;

  public subclass?: string;
  public background?: string;
  public alignment?: string;
  public xp?: number;

  public hitDice?: HitDice;
  public deathSaves?: { successes: number; failures: number };

  public spellcastingSystem?: 'slots' | 'points';
  public spellcastingAbility?: AttributeKey;
  public spellSaveDc?: number;
  public spellAttackBonus?: number;
  public spellSlots?: Record<string, { max: number; used: number }>;
  public spellPoints?: { max: number; current: number };
  public edition?: Edition;
  public resources?: Record<string, ResourceState>;
  /** The player's picks for the class's choices, by the choice's identity; kept on a class change. */
  public classChoices?: ClassChoiceSelections;
  /** The class's choices the player left open on purpose, by the choice's identity. */
  public dismissedChoices?: string[];

  constructor(options: DnD5eCharacterOptions) {
    super(
      options.id,
      options.name,
      SYSTEMS.dnd5e.id,
      options.ownerUsername,
      options.attributes,
      options.hp,
      options.level,
      options.lore ?? Lore.empty(),
      options.accentColor,
      options.avatarUrl,
      options.kind,
      options.sheetBackgroundUrl,
    );
    this.class = options.classStr ?? '';
    this.race = options.race ?? '';
    this.ac = options.ac ?? 10;
    this.speed = options.speed ?? 9; // metres: the SRD's 30 ft
    this.initiative = options.initiative ?? 0;
    this.hpTemp = options.hpTemp ?? 0;
    this.skills = options.skills ?? {};
    // Kept as stored: an ability left out follows the class, which is not the same as `false`
    this.savingThrowProficiencies = { ...options.savingThrowProficiencies };
    this.passivePerception = options.passivePerception ?? 10;
    this.proficiencies = options.proficiencies;
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
    this.edition = options.edition;
    this.resources = options.resources;
    this.classChoices = options.classChoices;
    this.dismissedChoices = options.dismissedChoices;
  }

  toJSON(): Record<string, unknown> {
    return {
      id: this.id,
      name: this.name,
      system: this.system,
      ownerUsername: this.ownerUsername,
      kind: this.kind,
      revision: this.revision,
      level: this.level,
      avatarUrl: this.avatarUrl,
      accentColor: this.accentColor,
      sheetBackgroundUrl: this.sheetBackgroundUrl,
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
      // Undefined leaves the key out of the row: an old sheet saved again stays without it
      proficiencies: this.proficiencies,

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
      edition: this.edition,
      resources: this.resources,
      classChoices: this.classChoices,
      dismissedChoices: this.dismissedChoices,
    };
  }
}

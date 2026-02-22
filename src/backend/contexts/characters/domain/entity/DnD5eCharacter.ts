import { Character } from "./Character";
import { Attributes } from "../value-object/Attributes";
import { HealthPoints } from "../value-object/HealthPoints";

export type AttributeKey = 'STR' | 'DEX' | 'CON' | 'INT' | 'WIS' | 'CHA';
export type SkillKey = 'Acrobatics' | 'Animal Handling' | 'Arcana' | 'Athletics' | 'Deception' | 'History' | 'Insight' | 'Intimidation' | 'Investigation' | 'Medicine' | 'Nature' | 'Perception' | 'Performance' | 'Persuasion' | 'Religion' | 'Sleight of Hand' | 'Stealth' | 'Survival';

export interface CharacterSkill {
    isProficient: boolean;
    expertise?: boolean;
}

export class DnD5eCharacter extends Character {
    public characterClass: string;
    public race: string;
    public ac: number;
    public speed: number;
    public initiative: number;
    public skills: Partial<Record<SkillKey, CharacterSkill>>;
    public savingThrowProficiencies: Record<AttributeKey, boolean>;
    public spells: string[];

    constructor(
        id: string,
        name: string,
        ownerUsername: string,
        attributes: Attributes,
        hp: HealthPoints,
        level: number,
        characterClass: string = '',
        race: string = '',
        ac: number = 10,
        speed: number = 30,
        initiative: number = 0,
        skills: Partial<Record<SkillKey, CharacterSkill>> = {},
        savingThrowProficiencies: Partial<Record<AttributeKey, boolean>> = {},
        spells: string[] = []
    ) {
        super(id, name, 'DnD_5e', ownerUsername, attributes, hp, level);
        this.characterClass = characterClass;
        this.race = race;
        this.ac = ac;
        this.speed = speed;
        this.initiative = initiative;
        this.skills = skills;
        this.savingThrowProficiencies = this.normalizeSavingThrows(savingThrowProficiencies);
        this.spells = spells;
    }

    private normalizeSavingThrows(saves: Partial<Record<AttributeKey, boolean>>): Record<AttributeKey, boolean> {
        const defaultSaves: Record<AttributeKey, boolean> = {
            STR: false, DEX: false, CON: false, INT: false, WIS: false, CHA: false
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

    calculatePassivePerception(): number {
        return 10 + this.calculateSkillValue('Perception', 'WIS');
    }

    getCombatStats(): Record<string, unknown> {
        return {
            ac: this.ac,
            hp: this.hp.status,
            speed: this.speed,
            initiative: this.initiative + this.getModifier('DEX'), // Initiative normally is just DEX mod, plus possible bonuses
            proficiencyBonus: this.proficiencyBonus
        };
    }

    toJSON(): Record<string, unknown> {
        return {
            id: this.id,
            name: this.name,
            system: this.system,
            ownerUsername: this.ownerUsername,
            level: this.level,
            attributes: this.attributes.getAll(),
            hp: this.hp.status,
            characterClass: this.characterClass,
            race: this.race,
            ac: this.ac,
            speed: this.speed,
            initiative: this.initiative,
            skills: this.skills,
            savingThrowProficiencies: this.savingThrowProficiencies,
            spells: this.spells
        };
    }
}

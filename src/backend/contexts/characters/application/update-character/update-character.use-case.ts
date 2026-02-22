import { CharacterRepo } from "../../domain/repository";
import { DnD5eCharacter, AttributeKey, CharacterSkill, SkillKey } from "../../domain/entity/DnD5eCharacter";
import { HealthPoints } from "../../domain/value-object/HealthPoints";

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
        spells?: string[];
    };
}

export class UpdateCharacterUseCase {
    constructor(private repository: CharacterRepo) { }

    async execute(input: UpdateCharacterInput): Promise<DnD5eCharacter> {
        const character = await this.repository.findById(input.id);

        if (!character) {
            throw new Error("Personagem não encontrado.");
        }

        if (character.ownerUsername !== input.ownerUsername) {
            throw new Error("Não autorizado a modificar este personagem.");
        }

        if (!(character instanceof DnD5eCharacter)) {
            throw new Error("Suporte apenas para D&D 5e no momento.");
        }

        const u = input.updates;

        if (u.name !== undefined) character.name = u.name;
        if (u.characterClass !== undefined) character.characterClass = u.characterClass;
        if (u.race !== undefined) character.race = u.race;
        if (u.level !== undefined) character.level = Math.max(1, u.level);
        if (u.ac !== undefined) character.ac = u.ac;
        if (u.speed !== undefined) character.speed = u.speed;
        if (u.initiative !== undefined) character.initiative = u.initiative;

        if (u.hpCurrent !== undefined || u.hpMax !== undefined) {
            const currentHp = u.hpCurrent !== undefined ? u.hpCurrent : character.hp.status.current;
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

        if (u.savingThrowProficiencies) {
            character.savingThrowProficiencies = { ...character.savingThrowProficiencies, ...u.savingThrowProficiencies };
        }

        if (u.spells !== undefined) {
            character.spells = u.spells;
        }

        await this.repository.save(character);

        return character;
    }
}

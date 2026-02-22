import { describe, it, expect } from 'vitest';
import { DnD5eCharacter } from './DnD5eCharacter';
import { Attributes } from '../value-object/Attributes';
import { HealthPoints } from '../value-object/HealthPoints';

describe('DnD5eCharacter (Domain Entity)', () => {
    const buildCharacter = (attrs: Record<string, number> = {}, level = 1, skills = {}, saves = {}) => {
        return new DnD5eCharacter(
            'id-123',
            'Thor',
            'user1',
            new Attributes(attrs),
            new HealthPoints(10, 10),
            level,
            'Fighter',
            'Human',
            10,
            30,
            0,
            skills,
            saves
        );
    };

    it('deve calcular o modificador corretamente', () => {
        const char = buildCharacter({ STR: 18, DEX: 15, CON: 8 });
        expect(char.getModifier('STR')).toBe(4);
        expect(char.getModifier('DEX')).toBe(2);
        expect(char.getModifier('CON')).toBe(-1);
    });

    it('deve calcular o bônus de proficiência baseado no nível', () => {
        expect(buildCharacter({}, 1).proficiencyBonus).toBe(2);
        expect(buildCharacter({}, 4).proficiencyBonus).toBe(2);
        expect(buildCharacter({}, 5).proficiencyBonus).toBe(3);
        expect(buildCharacter({}, 20).proficiencyBonus).toBe(6);
    });

    it('deve calcular perícia sem proficiência', () => {
        const char = buildCharacter({ STR: 16 }); // mod: +3
        expect(char.calculateSkillValue('Athletics', 'STR')).toBe(3);
    });

    it('deve calcular perícia com proficiência normal', () => {
        const char = buildCharacter({ STR: 16 }, 1, { Athletics: { isProficient: true } });
        // mod(+3) + prof(+2)
        expect(char.calculateSkillValue('Athletics', 'STR')).toBe(5);
    });

    it('deve calcular perícia com expertise', () => {
        const char = buildCharacter({ STR: 16 }, 5, { Athletics: { isProficient: true, expertise: true } });
        // mod(+3) + prof(3 * 2 = 6)
        expect(char.calculateSkillValue('Athletics', 'STR')).toBe(9);
    });

    it('deve calcular salvaguarda corretamente', () => {
        const char = buildCharacter({ DEX: 14 }, 1, {}, { DEX: true });
        // mod(+2) + prof(+2)
        expect(char.calculateSavingThrow('DEX')).toBe(4);
        // mod(+2) + prof(0) -- sem proficiencia
        expect(char.calculateSavingThrow('STR')).toBe(0); // 10 base -> mod 0
    });

    it('deve calcular percepção passiva', () => {
        // mod(+3) + prof(+2) + 10 = 15
        const char = buildCharacter({ WIS: 16 }, 1, { Perception: { isProficient: true } });
        expect(char.calculatePassivePerception()).toBe(15);
    });

    it('deve exportar corretamente via toJSON (Data Transfer Object)', () => {
        const char = buildCharacter({ STR: 18 }, 1, {}, {});
        char.spells = ['fireball', 'shield'];

        const json = char.toJSON();

        expect(json.id).toBeDefined();
        expect(json.name).toBe('Thor');
        expect(json.system).toBe('DnD_5e');

        // Atributos foram convertidos para object standard?
        expect((json.attributes as unknown as { STR: number }).STR).toBe(18);

        // Array de spells veio puro?
        expect(json.spells).toContain('fireball');
    });
});

import { describe, expect, it } from 'vitest';

import {
  calculatePassiveInsight,
  calculatePassivePerception,
  calculateSavingThrow,
  calculateSkillValue,
  getHalfProficiencyBonus,
  getModifier,
  getProficiencyBonus,
} from './calculations';

describe('D&D 5e calculations', () => {
  it.each([
    [1, -5],
    [8, -1],
    [9, -1],
    [10, 0],
    [11, 0],
    [15, 2],
    [18, 4],
    [30, 10],
  ])('getModifier(%i) = %i', (value, expected) => {
    expect(getModifier(value)).toBe(expected);
  });

  it.each([
    [1, 2],
    [4, 2],
    [5, 3],
    [8, 3],
    [9, 4],
    [13, 5],
    [17, 6],
    [20, 6],
  ])('getProficiencyBonus(level %i) = %i', (level, expected) => {
    expect(getProficiencyBonus(level)).toBe(expected);
  });

  describe('calculateSkillValue', () => {
    it('is the attribute modifier without proficiency', () => {
      expect(calculateSkillValue(16, 5, false)).toBe(3);
    });

    it('ignores expertise without proficiency', () => {
      expect(calculateSkillValue(16, 5, false, true)).toBe(3);
    });

    it('adds the proficiency bonus when proficient', () => {
      expect(calculateSkillValue(16, 1, true)).toBe(5);
    });

    it('doubles the proficiency bonus with expertise', () => {
      expect(calculateSkillValue(16, 5, true, true)).toBe(9);
    });
  });

  describe('calculateSavingThrow', () => {
    it('adds the proficiency bonus only when proficient', () => {
      expect(calculateSavingThrow(14, 1, true)).toBe(4);
      expect(calculateSavingThrow(14, 1, false)).toBe(2);
    });
  });

  describe('calculatePassiveInsight', () => {
    it('is 10 + Insight', () => {
      expect(calculatePassiveInsight(10, 1, false)).toBe(10);
      expect(calculatePassiveInsight(14, 5, true)).toBe(15);
      expect(calculatePassiveInsight(14, 5, true, true)).toBe(18);
    });
  });

  describe('calculatePassivePerception', () => {
    it('is 10 + Perception', () => {
      expect(calculatePassivePerception(10, 1, false)).toBe(10);
      expect(calculatePassivePerception(14, 1, true)).toBe(14);
    });

    it('counts expertise and follows the level', () => {
      expect(calculatePassivePerception(14, 5, true, true)).toBe(18);
      expect(calculatePassivePerception(14, 9, true, true)).toBe(20);
    });
  });

  describe('meia proficiência', () => {
    const JACK = { rounding: 'down' } as const;
    const ATHLETE = { rounding: 'up', abilities: ['STR', 'DEX', 'CON'] } as const;

    // PB +2 (nv 1), +3 (5), +4 (9), +5 (13), +6 (17)
    it.each([
      [1, 1, 1],
      [5, 1, 2],
      [9, 2, 2],
      [13, 2, 3],
      [17, 3, 3],
    ])('nível %i: +%i pra baixo, +%i pra cima', (level, down, up) => {
      expect(getHalfProficiencyBonus(JACK, level, 'INT', false)).toBe(down);
      expect(getHalfProficiencyBonus(ATHLETE, level, 'STR', false)).toBe(up);
    });

    it('não se soma a um teste que já tem proficiência', () => {
      expect(getHalfProficiencyBonus(JACK, 5, 'DEX', true)).toBe(0);
      expect(getHalfProficiencyBonus(ATHLETE, 5, 'STR', true)).toBe(0);
      // A perícia proficiente fica só com o PB: mod. +2, PB +3
      expect(calculateSkillValue(14, 5, true) + getHalfProficiencyBonus(JACK, 5, 'DEX', true)).toBe(
        5,
      );
    });

    it('Pau pra Toda Obra vale para todo atributo; Atleta Extraordinário só FOR, DES e CON', () => {
      for (const ability of ['STR', 'DEX', 'CON', 'INT', 'WIS', 'CHA'] as const) {
        expect(getHalfProficiencyBonus(JACK, 5, ability, false)).toBe(1);
      }
      expect(getHalfProficiencyBonus(ATHLETE, 5, 'CON', false)).toBe(2);
      for (const ability of ['INT', 'WIS', 'CHA'] as const) {
        expect(getHalfProficiencyBonus(ATHLETE, 5, ability, false)).toBe(0);
      }
    });

    it('a salvaguarda não recebe meia proficiência', () => {
      // Sem proficiência: só o modificador, com ou sem a característica
      expect(calculateSavingThrow(14, 5, false)).toBe(2);
      expect(calculateSavingThrow(14, 5, true)).toBe(5);
    });
  });
});

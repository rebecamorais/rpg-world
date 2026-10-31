import { describe, expect, it } from 'vitest';

import {
  calculatePassiveInsight,
  calculatePassivePerception,
  calculateSavingThrow,
  calculateSkillValue,
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
});

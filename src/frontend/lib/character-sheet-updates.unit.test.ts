import { describe, expect, it } from 'vitest';

import type { DraftPatch } from '@frontend/hooks/useDraft';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import {
  setAttribute,
  setDeathSaves,
  setHitDice,
  setHitDiceRemaining,
  setResourceUsed,
  setSavingThrow,
  setSkill,
  setSpellPoints,
  setSpellSlots,
} from './character-sheet-updates';

const character = {
  ...createDnD5eCharacter('owner-1', 'Thor'),
  id: 'char-1',
  passivePerception: 12, // legacy value stored by older versions of the editor
} as DnD5eCharacter;

const apply = (patch: DraftPatch<DnD5eCharacter>) =>
  typeof patch === 'function' ? patch(character) : patch;

describe('character sheet patches', () => {
  it('muda só o atributo dado, sem gravar a percepção passiva derivada', () => {
    const patch = apply(setAttribute('WIS', 16));

    expect(patch).toEqual({ attributes: { ...character.attributes, WIS: 16 } });
    expect(character.attributes.WIS).toBe(10);
  });

  it('marca proficiência em perícia e em salvaguarda', () => {
    expect(apply(setSkill('PERCEPTION', { isProficient: true, expertise: true }))).toEqual({
      skills: { ...character.skills, PERCEPTION: { isProficient: true, expertise: true } },
    });
    expect(apply(setSavingThrow('CON', true)).savingThrowProficiencies?.CON).toBe(true);
  });

  it('completa pontos de magia e dados de vida com o valor atual', () => {
    expect(apply(setSpellPoints('max', 12))).toEqual({ spellPoints: { current: 0, max: 12 } });
    expect(apply(setHitDice('5d10'))).toEqual({
      hitDice: { total: '5d10', current: character.level },
    });
  });

  it('troca um nível de espaços sem perder os outros', () => {
    const withSlots = { ...character, spellSlots: { '1': { max: 4, used: 0 } } };
    const patch = (setSpellSlots('2', 3, 1) as (c: DnD5eCharacter) => Partial<DnD5eCharacter>)(
      withSlots,
    );

    expect(patch.spellSlots).toEqual({ '1': { max: 4, used: 0 }, '2': { max: 3, used: 1 } });
  });

  it('grava os testes contra a morte', () => {
    expect(apply(setDeathSaves(2, 1))).toEqual({ deathSaves: { successes: 2, failures: 1 } });
  });

  it('dados de vida sem valor salvo começam cheios, no nível do personagem', () => {
    const patch = (setHitDice('d10') as (c: DnD5eCharacter) => Partial<DnD5eCharacter>)({
      ...character,
      level: 4,
      hitDice: undefined,
    });

    expect(patch).toEqual({ hitDice: { total: 'd10', current: 4 } });
  });

  it('muda os dados de vida restantes sem perder o total', () => {
    const withDice = { ...character, hitDice: { total: '4d10', current: 4 } };
    const patch = (setHitDiceRemaining(2) as (c: DnD5eCharacter) => Partial<DnD5eCharacter>)(
      withDice,
    );

    expect(patch).toEqual({ hitDice: { total: '4d10', current: 2 } });
    expect(apply(setHitDiceRemaining(1))).toEqual({ hitDice: { total: '', current: 1 } });
  });

  it('marca o uso de uma caixinha sem perder as outras', () => {
    const withBoxes = {
      ...character,
      resources: { 'class:monk:ki': { used: 3, hidden: true }, 'class:monk:x': { used: 1 } },
    };
    const patch = (
      setResourceUsed('class:monk:ki', 1) as (c: DnD5eCharacter) => Partial<DnD5eCharacter>
    )(withBoxes);

    expect(patch.resources).toEqual({
      'class:monk:ki': { used: 1, hidden: true },
      'class:monk:x': { used: 1 },
    });
  });
});

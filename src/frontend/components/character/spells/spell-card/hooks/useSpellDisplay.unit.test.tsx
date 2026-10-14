import { renderHookWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import {
  CATEGORY_THEMES,
  DAMAGE_THEMES,
  DEFAULT_THEME,
  SCHOOL_THEMES,
} from '@frontend/constants/damage-themes';
import type { Spell } from '@frontend/types/spells';

import { useSpellDisplay } from './useSpellDisplay';

const BASE: Spell = { id: 's1', name: 'Fireball', level: 3, school: 'evocation' };

function display(spell: Partial<Spell>) {
  return renderHookWithProviders(() => useSpellDisplay({ ...BASE, ...spell })).result.current;
}

describe('useSpellDisplay', () => {
  it('escolhe o tema pelo dano, depois categoria, depois escola', () => {
    const category = Object.keys(CATEGORY_THEMES)[0];

    expect(display({ damageType: 'Fire', spellCategory: category }).theme).toBe(DAMAGE_THEMES.fire);
    expect(display({ spellCategory: category }).theme).toBe(CATEGORY_THEMES[category]);
    expect(display({}).theme).toBe(SCHOOL_THEMES.evocation);
    expect(display({ school: 'unknown-school' }).theme).toBe(DEFAULT_THEME);
  });

  it('traduz escola, dano e componentes', () => {
    const { displayValues } = display({ damageType: 'fire', components: ['V', 'S', 'X'] });

    expect(displayValues.school).toBe('Evocation');
    expect(displayValues.damage).toBe('Fire');
    expect(displayValues.components.map((c) => c.label)).toEqual([
      'Verbal',
      'Somatic',
      'spellsData.components.X',
    ]);
    expect(displayValues.components[2]).toMatchObject({ icon: 'help-circle' });
  });

  it('formata tempo de conjuração completo e resumido', () => {
    const { displayValues } = display({ castingTime: 'bonus_action', castingValue: 1 });

    expect(displayValues.castingTime).toBe('1 Bonus Action');
    expect(displayValues.compactCastingTime).toBe('Bonus');
  });

  it('usa o tempo completo quando não existe versão resumida', () => {
    const { displayValues } = display({ castingTime: 'minute', castingValue: 10 });

    expect(displayValues.compactCastingTime).toBe('10 Minutes');
  });

  it('formata alcance e duração conhecidos', () => {
    const { displayValues } = display({
      rangeUnit: 'feet',
      rangeValue: 150,
      durationUnit: 'minute',
      durationValue: 1,
    });

    expect(displayValues.range).toBe('150 ft.');
    expect(displayValues.duration).toBe('1 minute');
  });

  it('repete valor e unidade quando a unidade não tem tradução', () => {
    const { displayValues } = display({
      rangeUnit: 'yards',
      rangeValue: 10,
      durationUnit: 'eon',
      durationValue: 2,
    });

    expect(displayValues.range).toBe('10 yards');
    expect(displayValues.duration).toBe('2 eon');
  });
});

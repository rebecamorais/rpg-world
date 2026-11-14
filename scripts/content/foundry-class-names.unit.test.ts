import { describe, expect, it } from 'vitest';

import { translateClassNames } from './foundry-class-names';
import { ptNameIndex } from './foundry-names';

const en = {
  fighter: {
    name: 'Fighter',
    subclassTitle: 'Martial Archetype',
    features: {
      asi: { name: 'Ability Score Improvement', description: 'x' },
      'second-wind': { name: 'Second Wind', description: 'x' },
    },
    resources: { 'second-wind': { name: 'Second Wind', note: 'n' } },
    choices: {},
    subclasses: {
      champion: {
        name: 'Champion',
        features: { crit: { name: 'Improved Critical', description: 'x' } },
        resources: {},
      },
    },
  },
};

const index = ptNameIndex([
  {
    Fighter: { name: 'Guerreiro' },
    'Second Wind': { name: 'Retomar o Fôlego' },
    Champion: { name: 'Campeão' },
    'Ability Score Improvement (Fighter)': { name: 'Aumento no Valor de Atributo (Guerreiro)' },
  },
]);

describe('translateClassNames', () => {
  it('translates only names, resources by the same index', () => {
    const { translation } = translateClassNames(en, {}, index);
    expect(translation.fighter).toEqual({
      name: 'Guerreiro',
      features: {
        asi: { name: 'Aumento no Valor de Atributo' },
        'second-wind': { name: 'Retomar o Fôlego' },
      },
      resources: { 'second-wind': { name: 'Retomar o Fôlego' } },
      subclasses: { champion: { name: 'Campeão' } },
    });
  });

  it('reports what had no match', () => {
    const { report } = translateClassNames(en, {}, index);
    expect(report.translated).toBe(5);
    expect(report.missing).toEqual([
      'fighter.subclassTitle',
      'fighter.subclasses.champion.features.crit.name',
    ]);
  });

  it('keeps what the repository already has, treating "" as missing', () => {
    const existing = { fighter: { name: 'Lutador', features: { 'second-wind': { name: '' } } } };
    const { translation } = translateClassNames(en, existing, index);
    expect(translation.fighter).not.toHaveProperty('name');
    expect(translation).toMatchObject({
      fighter: { features: { 'second-wind': { name: 'Retomar o Fôlego' } } },
    });
  });

  it('uses the subclass as context before the class', () => {
    const byContext = ptNameIndex([
      {
        'Improved Critical': { name: 'Crítico Melhorado' },
        'Improved Critical (Champion)': { name: 'Crítico Aprimorado' },
      },
    ]);
    const { translation } = translateClassNames(en, {}, byContext);
    expect(translation).toMatchObject({
      fighter: { subclasses: { champion: { features: { crit: { name: 'Crítico Aprimorado' } } } } },
    });
  });

  it('reports ambiguous names apart from missing ones', () => {
    const twoWays = ptNameIndex([
      { Champion: { name: 'Campeão' } },
      { Champion: { name: 'Campeã' } },
    ]);
    const { report } = translateClassNames(en, {}, twoWays);
    expect(report.ambiguous).toEqual(['fighter.subclasses.champion.name']);
    expect(report.missing).not.toContain('fighter.subclasses.champion.name');
  });
});

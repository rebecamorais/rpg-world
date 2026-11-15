import { describe, expect, it } from 'vitest';

import en51 from '../../../../../content/dnd5e/srd-5.1/i18n/en/classes.json';
import { getClassCatalog } from './srd-classes';

describe('FileClassCatalog (SRD)', () => {
  const catalog = getClassCatalog();

  it('monk 2014 em inglês traz o Ki', () => {
    const content = catalog.resources('2014', 'monk', 'en');
    expect(content?.classId).toBe('monk');
    expect(content?.hitDie).toBe(8);
    const ki = content?.resources.find((r) => r.id === 'ki');
    expect(ki?.name).toBeTruthy();
    expect(ki?.description).toBe(en51.monk.features.ki.description);
  });

  it('pt vazio cai no inglês', () => {
    expect(catalog.resources('2014', 'monk', 'pt')).toEqual(
      catalog.resources('2014', 'monk', 'en'),
    );
  });

  it('barbarian 2024 tem a subclasse berserker', () => {
    expect(catalog.resources('2024', 'barbarian', 'en')?.subclass.id).toBe('berserker');
  });

  it('classe desconhecida é null', () => {
    expect(catalog.resources('2014', 'artificer')).toBeNull();
  });

  it('não leva a descrição de features sem recurso', () => {
    const json = JSON.stringify(catalog.resources('2014', 'monk', 'en'));
    expect(json).not.toContain(en51.monk.features['unarmored-defense'].description);
  });
});

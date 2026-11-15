import { describe, expect, it } from 'vitest';

import type { ClassData, ClassText } from '@shared/systems/dnd5e/content/class.schema';

import en51 from '../../../../../content/dnd5e/srd-5.1/i18n/en/classes.json';
import { FileClassCatalog } from './file-class-catalog';
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

  // Traduzido ou não (o vazio cai no inglês, ver "textos traduzidos"), o Ki em pt sempre tem texto
  it('monk 2014 em português traz nome e descrição do Ki', () => {
    const pt = catalog.resources('2014', 'monk', 'pt')?.resources.find((r) => r.id === 'ki');
    expect(pt?.name).toBeTruthy();
    expect(pt?.description).toBeTruthy();
  });

  it('barbarian 2024 tem a subclasse berserker', () => {
    expect(catalog.resources('2024', 'barbarian', 'en')?.subclass.id).toBe('berserker');
  });

  it('classe desconhecida é null', () => {
    expect(catalog.resources('2014', 'artificer')).toBeNull();
  });

  it('traz os dados da classe por id: proficiências, conjuração, características e tabelas', () => {
    const monk = catalog.resources('2014', 'monk', 'en');
    expect(monk?.proficiencies.savingThrows).toEqual(['STR', 'DEX']);
    expect(monk?.proficiencies.skills.count).toBe(2);
    expect(monk?.spellcasting).toBeUndefined();
    expect(monk?.features.find((f) => f.id === 'martial-arts')).toEqual({
      id: 'martial-arts',
      level: 1,
      name: en51.monk.features['martial-arts'].name,
    });
    expect(monk?.subclassFeatures.length).toBeGreaterThan(0);
    expect(monk?.tables.map((t) => t.id)).toEqual(['martial-arts', 'unarmored-movement']);

    const wizard = catalog.resources('2014', 'wizard', 'en');
    expect(wizard?.spellcasting).toMatchObject({ ability: 'INT', progression: 'full' });
    expect(wizard?.spellcasting?.spellbook).toEqual({ initial: 6, perLevel: 2 });
    expect(wizard?.tables).toEqual([]);

    const sorcerer = catalog.resources('2014', 'sorcerer', 'en');
    expect(sorcerer?.choices).toMatchObject([{ id: 'metamagic', name: 'Metamagic' }]);
  });

  it('o nome da característica vem no idioma, e cai no inglês quando falta', () => {
    const pt = catalog.resources('2014', 'monk', 'pt');
    expect(pt?.features.every((f) => f.name)).toBe(true);
    expect(pt?.features.map((f) => f.id)).toEqual(
      catalog.resources('2014', 'monk', 'en')?.features.map((f) => f.id),
    );
  });

  it('não leva a descrição de features sem recurso', () => {
    const json = JSON.stringify(catalog.resources('2014', 'monk', 'en'));
    expect(json).not.toContain(en51.monk.features['unarmored-defense'].description);
  });
});

describe('FileClassCatalog (textos traduzidos)', () => {
  const resource = {
    feature: 'rage',
    level: 1,
    unit: 'uses',
    max: { type: 'steps', steps: [{ level: 1, value: 2 }] },
    recovery: [{ rest: 'long', amount: 'all' }],
  };
  const data = {
    id: 'barbarian',
    hitDie: 12,
    features: [],
    choices: [],
    resources: [{ ...resource, id: 'rage' }],
    subclasses: [
      {
        id: 'berserker',
        features: [],
        resources: [{ ...resource, id: 'frenzy', feature: 'frenzy' }],
      },
    ],
  } as unknown as ClassData;
  const text = {
    name: 'Barbarian',
    subclassTitle: 'Primal Path',
    features: { rage: { name: 'Rage', description: 'English rage' } },
    resources: { rage: { name: 'Rage', note: 'English note' } },
    choices: {},
    subclasses: {
      berserker: {
        name: 'Berserker',
        features: { frenzy: { name: 'Frenzy', description: 'English frenzy' } },
        resources: { frenzy: { name: 'Frenzy' } },
      },
    },
  } as ClassText;

  const catalogWith = (pt: Record<string, unknown>) =>
    new FileClassCatalog([
      {
        edition: '2014',
        classes: [data],
        texts: { barbarian: text },
        translations: { en: {}, pt: { barbarian: pt } },
      },
    ]);

  it('o texto do idioma vence quando preenchido', () => {
    const content = catalogWith({
      features: { rage: { description: 'Fúria' } },
      resources: { rage: { name: 'Fúria', note: 'Nota' } },
      subclasses: { berserker: { name: 'Berserker pt' } },
    }).resources('2014', 'barbarian', 'pt');
    const rage = content?.resources[0];
    expect(rage?.name).toBe('Fúria');
    expect(rage?.note).toBe('Nota');
    expect(rage?.description).toBe('Fúria');
    expect(content?.subclass.names).toEqual(['Berserker', 'Berserker pt']);
  });

  it('texto vazio no idioma cai no inglês', () => {
    const content = catalogWith({
      features: { rage: { description: '' } },
      resources: { rage: { name: '', note: '' } },
      subclasses: { berserker: { name: '' } },
    }).resources('2014', 'barbarian', 'pt');
    const rage = content?.resources[0];
    expect(rage?.name).toBe('Rage');
    expect(rage?.note).toBe('English note');
    expect(rage?.description).toBe('English rage');
    expect(content?.subclass.names).toEqual(['Berserker']);
  });

  it('marca a descrição que caiu no inglês, e só ela', () => {
    const catalog = catalogWith({ features: { rage: { description: 'Fúria' } } });
    const pt = catalog.resources('2014', 'barbarian', 'pt');
    expect(pt?.resources[0].untranslated).toBeUndefined();
    expect(pt?.subclass.resources[0].untranslated).toBe(true);
    // English is the original, never "untranslated"
    const en = catalog.resources('2014', 'barbarian', 'en');
    expect(en?.subclass.resources[0].untranslated).toBeUndefined();
  });

  it('nome da subclasse igual nos dois idiomas não duplica', () => {
    const content = catalogWith({
      subclasses: { berserker: { name: 'Berserker' } },
    }).resources('2014', 'barbarian', 'pt');
    expect(content?.subclass.names).toEqual(['Berserker']);
  });
});

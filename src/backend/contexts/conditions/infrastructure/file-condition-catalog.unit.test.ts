import { describe, expect, it } from 'vitest';

import { type ConditionSource, FileConditionCatalog } from './file-condition-catalog';

const source: ConditionSource = {
  source: 'srd-5.2',
  edition: '2024',
  conditions: [{ id: 'prone' }, { id: 'exhaustion', maxLevel: 6 }, { id: 'blinded' }],
  texts: {
    prone: { name: 'Prone', description: 'Lying down.' },
    exhaustion: { name: 'Exhaustion', description: 'Tired.' },
    blinded: { name: 'Blinded', description: 'Cannot see.' },
  },
  translations: {
    pt: {
      prone: { name: 'Caído', description: 'Deitado.' },
      blinded: { name: 'Cego', description: '' },
    },
  },
};
const old: ConditionSource = {
  source: 'srd-5.1',
  edition: '2014',
  conditions: [{ id: 'prone' }],
  texts: { prone: { name: 'Prone', description: 'Old prone.' } },
  translations: { pt: {} },
};

const catalog = new FileConditionCatalog([source, old]);

describe('FileConditionCatalog', () => {
  it('usa o nome pt quando existe e o en quando não, marcando como não traduzida', () => {
    const list = catalog.list('pt').filter((c) => c.edition === '2024');
    const byId = Object.fromEntries(list.map((c) => [c.id, c]));
    expect(byId.prone).toMatchObject({
      name: 'Caído',
      description: 'Deitado.',
      untranslated: false,
    });
    expect(byId.blinded).toMatchObject({
      name: 'Cego',
      description: 'Cannot see.',
      untranslated: true,
    });
    expect(byId.exhaustion).toMatchObject({ name: 'Exhaustion', untranslated: true });
  });

  it('em inglês nada é não traduzido; idioma desconhecido vira inglês', () => {
    expect(catalog.list('en').every((c) => !c.untranslated)).toBe(true);
    expect(catalog.list('__proto__')[0].name).toBeTypeOf('string');
  });

  it('ordena por edição e depois pelo nome', () => {
    expect(catalog.list('en').map((c) => `${c.edition}:${c.name}`)).toEqual([
      '2014:Prone',
      '2024:Blinded',
      '2024:Exhaustion',
      '2024:Prone',
    ]);
  });

  it('find acha pela chave, ou null', () => {
    expect(catalog.find('dnd5e:srd-5.2:condition:prone')).toMatchObject({
      id: 'prone',
      key: 'dnd5e:srd-5.2:condition:prone',
      edition: '2024',
    });
    expect(catalog.find('dnd5e:srd-5.2:condition:nada')).toBeNull();
  });

  it('maxLevel é 6 na exaustão e null nas outras', () => {
    expect(catalog.find('dnd5e:srd-5.2:condition:exhaustion')?.maxLevel).toBe(6);
    expect(catalog.find('dnd5e:srd-5.2:condition:prone')?.maxLevel).toBeNull();
  });
});

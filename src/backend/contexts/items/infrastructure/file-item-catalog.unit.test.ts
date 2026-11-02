import { describe, expect, it } from 'vitest';

import { itemKey } from '@shared/content/content-key';

import { FileItemCatalog, type ItemSource } from './file-item-catalog';

const source: ItemSource = {
  source: 'srd-5.2',
  edition: '2024',
  items: [
    { id: 'rope-hempen', category: 'gear', value: 100, weight: 10 },
    {
      id: 'longsword',
      category: 'weapon',
      value: 1500,
      weight: 3,
      damage: { dice: '1d8', type: 'S' },
      versatile: '1d10',
      properties: ['V'],
    },
    { id: 'ball-bearing', category: 'gear', value: 0.1 },
    { id: 'abacus', category: 'gear' },
  ],
  texts: {
    'rope-hempen': { name: 'Rope, Hempen', description: 'Fifty feet of rope.' },
    longsword: { name: 'Longsword', description: 'A blade.' },
    'ball-bearing': { name: 'Ball Bearing' },
    abacus: { name: 'Abacus' },
  },
  translations: {
    pt: {
      'rope-hempen': { name: 'Corda de cânhamo', description: '' },
      longsword: { name: 'Espada longa', description: 'Uma lâmina.' },
      'ball-bearing': { name: 'Rolamento' },
    },
  },
};
const old: ItemSource = {
  source: 'srd-5.1',
  edition: '2014',
  items: [{ id: 'rope-hempen', category: 'gear', value: 100 }],
  texts: { 'rope-hempen': { name: 'Rope, Hempen', description: 'Old rope.' } },
  translations: { pt: {} },
};

const catalog = new FileItemCatalog([source, old]);

describe('FileItemCatalog', () => {
  it('usa o nome pt e marca como não traduzido quando falta a descrição pt', () => {
    const byId = Object.fromEntries(
      catalog
        .list('pt')
        .filter((i) => i.edition === '2024')
        .map((i) => [i.id, i]),
    );
    expect(byId['rope-hempen']).toMatchObject({
      name: 'Corda de cânhamo',
      description: 'Fifty feet of rope.',
      untranslated: true,
    });
    expect(byId.longsword).toMatchObject({
      name: 'Espada longa',
      description: 'Uma lâmina.',
      untranslated: false,
    });
  });

  it('item sem descrição não é não traduzido quando o nome pt existe', () => {
    const byId = Object.fromEntries(catalog.list('pt').map((i) => [i.id, i]));
    expect(byId['ball-bearing']).toMatchObject({
      name: 'Rolamento',
      description: null,
      untranslated: false,
    });
    expect(byId.abacus).toMatchObject({ name: 'Abacus', untranslated: true });
  });

  it('idioma desconhecido cai no en, sem não traduzidos', () => {
    const list = catalog.list('fr');
    expect(list.find((i) => i.id === 'longsword')?.name).toBe('Longsword');
    expect(list.every((i) => !i.untranslated)).toBe(true);
    expect(catalog.list('__proto__')[0].name).toBeTypeOf('string');
  });

  it('monta o dto com os campos de regras e mantém o valor fracionário', () => {
    const dto = catalog.find(itemKey('srd-5.2', 'longsword'));
    expect(dto).toEqual({
      key: 'dnd5e:srd-5.2:item:longsword',
      id: 'longsword',
      edition: '2024',
      category: 'weapon',
      name: 'Longsword',
      description: 'A blade.',
      value: 1500,
      weight: 3,
      strength: null,
      stealthDisadvantage: false,
      ac: null,
      damage: { dice: '1d8', type: 'S' },
      versatile: '1d10',
      properties: ['V'],
      range: null,
      untranslated: false,
    });
    expect(catalog.find(itemKey('srd-5.2', 'ball-bearing'))?.value).toBe(0.1);
    expect(catalog.find(itemKey('srd-5.2', 'abacus'))?.value).toBeNull();
  });

  it('find acha pela chave e devolve null para chave inexistente', () => {
    expect(catalog.find(itemKey('srd-5.2', 'rope-hempen'))?.name).toBe('Rope, Hempen');
    expect(catalog.find(itemKey('srd-5.1', 'rope-hempen'))?.edition).toBe('2014');
    expect(catalog.find(itemKey('srd-5.2', 'nope'))).toBeNull();
  });

  it('findByKeys mantém a ordem e pula as desconhecidas', () => {
    const found = catalog.findByKeys(
      [
        itemKey('srd-5.2', 'longsword'),
        'dnd5e:srd-5.2:item:nope',
        itemKey('srd-5.1', 'rope-hempen'),
      ],
      'pt',
    );
    expect(found.map((i) => i.key)).toEqual([
      'dnd5e:srd-5.2:item:longsword',
      'dnd5e:srd-5.1:item:rope-hempen',
    ]);
    expect(found[0].name).toBe('Espada longa');
  });

  it('ordena por edição e depois por nome', () => {
    const list = catalog.list('en');
    expect(list.map((i) => i.key)).toEqual([
      'dnd5e:srd-5.1:item:rope-hempen',
      'dnd5e:srd-5.2:item:abacus',
      'dnd5e:srd-5.2:item:ball-bearing',
      'dnd5e:srd-5.2:item:longsword',
      'dnd5e:srd-5.2:item:rope-hempen',
    ]);
  });
});

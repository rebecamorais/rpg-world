import { describe, expect, it } from 'vitest';

import type { SpellData, SpellText } from '@shared/systems/dnd5e/content/spell.schema';

import { FileSpellCatalog, type SpellSource } from './file-spell-catalog';

const data = (id: string, level: number, patch: Partial<SpellData> = {}): SpellData => ({
  id,
  level,
  school: 'evocation',
  classes: ['wizard'],
  components: ['V'],
  castingTime: 'action',
  castingValue: 1,
  rangeUnit: 'feet',
  rangeValue: 60,
  durationUnit: 'instantaneous',
  durationValue: null,
  concentration: false,
  ritual: false,
  isScaling: false,
  materialCost: 0,
  damageType: null,
  spellCategory: 'utility',
  bgStyleId: null,
  ...patch,
});
const text = (name: string): SpellText => ({
  name,
  description: `${name} description.`,
  higherLevel: null,
  material: null,
});

const source: SpellSource = {
  source: 'srd-5.1',
  spells: [
    data('fireball', 3, { damageType: 'fire', classes: ['wizard', 'sorcerer'] }),
    data('lightning-bolt', 3, { damageType: 'lightning' }),
    data('shield', 1, { school: 'abjuration' }),
    data('light', 0, { classes: ['cleric'] }),
  ],
  texts: {
    en: {
      fireball: text('Fireball'),
      'lightning-bolt': text('Lightning Bolt'),
      shield: text('Shield'),
      light: text('Light'),
    },
    // Shield has no Portuguese text
    pt: { fireball: text('Bola de Fogo'), 'lightning-bolt': text('Relâmpago'), light: text('Luz') },
  },
};

const catalog = new FileSpellCatalog([source]);
const names = async (params: Parameters<FileSpellCatalog['findAll']>[0]) =>
  (await catalog.findAll(params)).data.map((s) => s.name);

describe('FileSpellCatalog', () => {
  it.each(['bola de fogo', 'BOLA', 'fogo'])('acha "Bola de Fogo" buscando %s', async (search) => {
    expect(await names({ locale: 'pt', search })).toEqual(['Bola de Fogo']);
  });

  it('busca sem acento acha nome com acento', async () => {
    expect(await names({ locale: 'pt', search: 'relampago' })).toEqual(['Relâmpago']);
  });

  it.each([
    [{ level: 1 }, ['Shield']],
    [{ school: 'abjuration' }, ['Shield']],
    [{ class: 'sorcerer' }, ['Fireball']],
    [{ damageType: 'lightning' }, ['Lightning Bolt']],
  ])('filtra por %o', async (filter, expected) => {
    expect(await names({ locale: 'en', ...filter })).toEqual(expected);
  });

  it('ordena por nível e depois pelo nome no idioma', async () => {
    expect(await names({ locale: 'en' })).toEqual([
      'Light',
      'Shield',
      'Fireball',
      'Lightning Bolt',
    ]);
  });

  it('pagina sem repetir e com o total certo', async () => {
    const first = await catalog.findAll({ locale: 'en', page: 0, limit: 3 });
    const second = await catalog.findAll({ locale: 'en', page: 1, limit: 3 });

    expect(first.total).toBe(4);
    expect(first.data).toHaveLength(3);
    expect(second.data.map((s) => s.name)).toEqual(['Lightning Bolt']);
  });

  it('sem texto no idioma, usa o inglês', async () => {
    const [shield] = (await catalog.findAll({ locale: 'pt', level: 1 })).data;
    expect(shield.name).toBe('Shield');
    expect(shield.description).toBe('Shield description.');
  });

  it.each(['pt_BR', '__proto__', 'toString'])(
    'idioma desconhecido (%s) usa o inglês em vez de quebrar',
    async (locale) => {
      expect(await names({ locale })).toEqual(['Light', 'Shield', 'Fireball', 'Lightning Bolt']);
      expect((await catalog.findByKeys(['dnd5e:srd-5.1:spell:light'], locale))[0].name).toBe(
        'Light',
      );
    },
  );

  it('devolve a chave completa como id', async () => {
    const [light] = (await catalog.findAll({ locale: 'en', level: 0 })).data;
    expect(light.id).toBe('dnd5e:srd-5.1:spell:light');
    expect(light).toMatchObject({ level: 0, classes: ['cleric'], components: ['V'] });
  });

  it('findByKeys devolve as magias na ordem pedida e ignora chaves desconhecidas', async () => {
    const found = await catalog.findByKeys(
      ['dnd5e:srd-5.1:spell:light', 'dnd5e:srd-5.1:spell:nope', 'dnd5e:srd-5.1:spell:fireball'],
      'pt',
    );
    expect(found.map((s) => s.name)).toEqual(['Luz', 'Bola de Fogo']);
  });
});

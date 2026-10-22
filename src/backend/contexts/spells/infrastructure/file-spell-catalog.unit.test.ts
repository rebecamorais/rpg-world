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
const text = (name: string): SpellText => ({ name, description: `${name} description.` });

const source: SpellSource = {
  source: 'srd-5.1',
  edition: '2014',
  spells: [
    data('fireball', 3, { damageType: 'fire', classes: ['wizard', 'sorcerer'] }),
    data('lightning-bolt', 3, { damageType: 'lightning' }),
    data('shield', 1, { school: 'abjuration' }),
    data('light', 0, { classes: ['cleric'] }),
  ],
  texts: {
    fireball: { ...text('Fireball'), higherLevel: 'More damage.', material: 'Bat guano.' },
    'lightning-bolt': text('Lightning Bolt'),
    shield: text('Shield'),
    light: text('Light'),
  },
  translations: {
    // Shield has no Portuguese text; Light only has its name so far. Crowdin sends what is not
    // translated yet as "" (Lightning Bolt's description, Fireball's material).
    pt: {
      fireball: { ...text('Bola de Fogo'), higherLevel: 'Mais dano.', material: '' },
      'lightning-bolt': { name: 'Relâmpago', description: '' },
      light: { name: 'Luz' },
    },
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

  it('tradução parcial completa os campos que faltam com o inglês', async () => {
    const [light] = (await catalog.findAll({ locale: 'pt', level: 0 })).data;
    expect(light.name).toBe('Luz');
    expect(light.description).toBe('Light description.');
  });

  it('texto vazio vindo do Crowdin conta como não traduzido', async () => {
    const [bolt] = await catalog.findByKeys(['dnd5e:srd-5.1:spell:lightning-bolt'], 'pt');
    expect(bolt.name).toBe('Relâmpago');
    expect(bolt.description).toBe('Lightning Bolt description.');

    const [fireball] = await catalog.findByKeys(['dnd5e:srd-5.1:spell:fireball'], 'pt');
    expect(fireball.higherLevel).toBe('Mais dano.');
    expect(fireball.material).toBe('Bat guano.');
  });

  it('campo opcional ausente vira null', async () => {
    const [shield] = await catalog.findByKeys(['dnd5e:srd-5.1:spell:shield'], 'en');
    expect(shield.higherLevel).toBeNull();
    expect(shield.material).toBeNull();
  });

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

  it('marca a edição de cada magia', async () => {
    const [light] = await catalog.findByKeys(['dnd5e:srd-5.1:spell:light'], 'en');
    expect(light.edition).toBe('2014');
  });

  it.each([
    ['pt', 'dnd5e:srd-5.1:spell:shield', true],
    ['pt', 'dnd5e:srd-5.1:spell:light', true],
    ['pt', 'dnd5e:srd-5.1:spell:fireball', false],
    ['en', 'dnd5e:srd-5.1:spell:shield', false],
  ])('em %s, %s tem untranslated = %s', async (locale, key, untranslated) => {
    const [spell] = await catalog.findByKeys([key], locale);
    expect(spell.untranslated).toBe(untranslated);
  });
});

describe('FileSpellCatalog com duas edições', () => {
  const twoEditions = new FileSpellCatalog([
    source,
    {
      source: 'srd-5.2',
      edition: '2024',
      spells: [data('fireball', 3, { rangeValue: 150 })],
      texts: { fireball: text('Fireball') },
      translations: { pt: {} },
    },
  ]);

  it('a mesma magia nas duas edições aparece duas vezes, cada uma com a sua', async () => {
    const { data: found } = await twoEditions.findAll({ locale: 'en', search: 'fireball' });
    expect(found.map((s) => [s.id, s.edition])).toEqual([
      ['dnd5e:srd-5.1:spell:fireball', '2014'],
      ['dnd5e:srd-5.2:spell:fireball', '2024'],
    ]);
  });

  it('filtra por edição', async () => {
    const { data: found, total } = await twoEditions.findAll({ locale: 'pt', edition: '2024' });
    expect(total).toBe(1);
    expect(found[0]).toMatchObject({ name: 'Fireball', edition: '2024', untranslated: true });
  });

  // In Portuguese the 2014 spell is "Bola de Fogo" and the 2024 one still "Fireball"
  it('a busca também acha pelo nome em inglês, então as duas edições aparecem', async () => {
    const { data: found } = await twoEditions.findAll({ locale: 'pt', search: 'fireball' });
    expect(found.map((s) => s.name)).toEqual(['Bola de Fogo', 'Fireball']);
  });
});

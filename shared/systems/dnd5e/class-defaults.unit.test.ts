import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { type SavedSavingThrows, classDefaults, effectiveSavingThrows } from './class-defaults';
import type { ClassData } from './content/class.schema';
import type { Edition } from './content/editions';
import type { AttributeKey } from './types';

const classes = JSON.parse(
  readFileSync(join(process.cwd(), 'content/dnd5e/srd-5.1/classes.json'), 'utf8'),
) as ClassData[];

const ATTRS: Record<AttributeKey, number> = {
  STR: 10,
  DEX: 10,
  CON: 10,
  INT: 10,
  WIS: 10,
  CHA: 10,
};

/** The class as the content API sends it, on the 2014 edition unless told otherwise. */
const content = (id: string, edition: Edition = '2014') => {
  const data = classes.find((c) => c.id === id);
  if (!data) throw new Error(`no class ${id}`);
  const { hitDie, proficiencies, spellcasting } = data;
  return { classId: id, edition, hitDie, proficiencies, spellcasting };
};
const defaultsOf = (id: string, attributes = ATTRS) => {
  const defaults = classDefaults('2014', content(id), attributes);
  if (!defaults) throw new Error(`no defaults for ${id}`);
  return defaults;
};

/** The abilities the sheet shows as proficient. */
const proficient = (saved: SavedSavingThrows | undefined, classId: string | null) => {
  const saves = effectiveSavingThrows(saved, classId ? defaultsOf(classId) : null);
  return (Object.keys(saves) as AttributeKey[]).filter((key) => saves[key].proficient);
};

describe('padrões da classe no nível 1 (SRD 5.1)', () => {
  it('Bárbaro: d12, 12 + CON de PV, FOR e CON, sem conjuração', () => {
    const barbarian = defaultsOf('barbarian', { ...ATTRS, CON: 16 });
    expect(barbarian.hitDie).toBe('d12');
    expect(barbarian.hpMax).toBe(15);
    expect(barbarian.savingThrows).toEqual(['STR', 'CON']);
    expect(barbarian.armor).toEqual(['light', 'medium', 'shield']);
    expect(barbarian.weapons).toEqual(['simple', 'martial']);
    expect(barbarian.spellcastingAbility).toBeUndefined();
    expect(barbarian.choices).toEqual([
      expect.objectContaining({ key: '2014/barbarian/skills', kind: 'skills', count: 2 }),
    ]);
  });

  it('Bardo: 3 perícias quaisquer e 3 instrumentos à escolha', () => {
    const bard = defaultsOf('bard');
    expect(bard.hitDie).toBe('d8');
    expect(bard.hpMax).toBe(8);
    expect(bard.savingThrows).toEqual(['DEX', 'CHA']);
    expect(bard.spellcastingAbility).toBe('CHA');
    const [skills, tools] = bard.choices;
    expect(skills).toMatchObject({ key: '2014/bard/skills', count: 3 });
    expect(skills.from).toHaveLength(18);
    expect(tools).toEqual({
      key: '2014/bard/tools',
      kind: 'tools',
      count: 3,
      from: ['musical-instrument'],
    });
  });

  it('Clérigo: sem armadura pesada, que só vem da subclasse', () => {
    const cleric = defaultsOf('cleric');
    expect(cleric.savingThrows).toEqual(['WIS', 'CHA']);
    expect(cleric.armor).toEqual(['light', 'medium', 'shield']);
    expect(cleric.armor).not.toContain('heavy');
    expect(cleric.spellcastingAbility).toBe('WIS');
  });

  it('Mago: d6, INT e SAB, conjura com INT', () => {
    const wizard = defaultsOf('wizard', { ...ATTRS, CON: 8 });
    expect(wizard.hitDie).toBe('d6');
    expect(wizard.hpMax).toBe(5);
    expect(wizard.savingThrows).toEqual(['INT', 'WIS']);
    expect(wizard.armor).toEqual([]);
    expect(wizard.spellcastingAbility).toBe('INT');
  });

  it('o PV do nível 1 nunca fica abaixo de 1', () => {
    expect(defaultsOf('wizard', { ...ATTRS, CON: 1 }).hpMax).toBe(1);
  });

  it('ferramenta fixa vem pelo id; monge escolhe 1 ferramenta de artesão ou instrumento', () => {
    expect(defaultsOf('rogue').tools).toEqual(['thieves-tools']);
    expect(defaultsOf('monk').choices[1]).toMatchObject({
      key: '2014/monk/tools',
      count: 1,
      from: ['artisan-tools', 'musical-instrument'],
    });
  });

  it('mudar o resultado não muda o conteúdo da classe', () => {
    const source = content('fighter');
    classDefaults('2014', source, ATTRS)?.savingThrows.push('CHA');
    expect(source.proficiencies.savingThrows).toEqual(['STR', 'CON']);
  });
});

describe('portão da edição', () => {
  it.each([[undefined], ['2024' as const]])('ficha com edição %s não segue a classe', (edition) => {
    expect(classDefaults(edition, content('fighter'), ATTRS)).toBeNull();
  });

  it('conteúdo de outra edição não serve para uma ficha de 2014', () => {
    expect(classDefaults('2014', content('fighter', '2024'), ATTRS)).toBeNull();
  });

  it('classe fora das 12 (sem conteúdo) não segue nada', () => {
    expect(classDefaults('2014', null, ATTRS)).toBeNull();
  });

  it('sem classe para seguir, salvaguarda sem valor é não proficiente', () => {
    expect(proficient({}, null)).toEqual([]);
    expect(proficient(undefined, null)).toEqual([]);
    expect(proficient({ DEX: true }, null)).toEqual(['DEX']);
  });
});

describe('salvaguardas: herdar, proficiente, não proficiente', () => {
  it('ficha nova de Guerreiro herda FOR e CON sem nada salvo', () => {
    const saves = effectiveSavingThrows({}, defaultsOf('fighter'));
    expect(proficient({}, 'fighter')).toEqual(['STR', 'CON']);
    expect(saves.STR).toEqual({ proficient: true, source: 'inherit', classDefault: true });
    expect(saves.DEX).toEqual({ proficient: false, source: 'inherit', classDefault: false });
  });

  it('os três estados são diferentes por atributo', () => {
    const saves = effectiveSavingThrows({ STR: false, DEX: true }, defaultsOf('fighter'));
    // Desligada à mão, embora a classe dê
    expect(saves.STR).toEqual({ proficient: false, source: 'manual', classDefault: true });
    // Ligada à mão, embora a classe não dê
    expect(saves.DEX).toEqual({ proficient: true, source: 'manual', classDefault: false });
    // Herdada
    expect(saves.CON).toEqual({ proficient: true, source: 'inherit', classDefault: true });
  });

  it('ligada à mão igual à classe continua sendo um ajuste', () => {
    const saved = { STR: true };
    expect(effectiveSavingThrows(saved, defaultsOf('fighter')).STR.source).toBe('manual');
    // E por isso continua ligada quando a classe deixa de dar
    expect(proficient(saved, 'wizard')).toEqual(['STR', 'INT', 'WIS']);
  });

  it('ajuste em SAB não muda CON', () => {
    expect(proficient({ WIS: true }, 'fighter')).toEqual(['STR', 'CON', 'WIS']);
  });

  it('Guerreiro → Mago → Guerreiro com FOR desligada à mão', () => {
    const saved = { STR: false };
    expect(proficient(saved, 'fighter')).toEqual(['CON']);
    expect(proficient(saved, 'wizard')).toEqual(['INT', 'WIS']);
    expect(proficient(saved, 'fighter')).toEqual(['CON']);
  });

  it('trocar de classe muda só as herdadas', () => {
    expect(proficient({}, 'fighter')).toEqual(['STR', 'CON']);
    expect(proficient({}, 'wizard')).toEqual(['INT', 'WIS']);
    expect(proficient({}, 'fighter')).toEqual(['STR', 'CON']);
  });

  it('remover o ajuste devolve o que a classe dá', () => {
    const { STR: _, ...withoutStr } = { STR: false, DEX: true };
    expect(proficient(withoutStr, 'fighter')).toEqual(['STR', 'DEX', 'CON']);
  });

  it('ficha antiga com as seis salvas continua igual, em qualquer classe', () => {
    const old = { STR: false, DEX: true, CON: false, INT: false, WIS: true, CHA: false };
    for (const classId of ['fighter', 'wizard', null]) {
      expect(proficient(old, classId)).toEqual(['DEX', 'WIS']);
    }
    const saves = effectiveSavingThrows(old, defaultsOf('fighter'));
    expect(Object.values(saves).every((save) => save.source === 'manual')).toBe(true);
  });
});

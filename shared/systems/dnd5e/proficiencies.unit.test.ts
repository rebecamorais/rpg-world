import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { classDefaults } from './class-defaults';
import type { ClassData } from './content/class.schema';
import type { Edition } from './content/editions';
import { LANGUAGE_IDS } from './languages';
import {
  ARMOR_IDS,
  FEATURE_GRANTS,
  type ProficiencyKind,
  SUBCLASS_GRANTS,
  type SavedProficiencies,
  addOwnProficiency,
  addProficiency,
  effectiveProficiencies,
  removeProficiency,
  restoreProficiency,
} from './proficiencies';
import type { AttributeKey } from './types';

const classes = JSON.parse(
  readFileSync(join(process.cwd(), 'content/dnd5e/srd-5.1/classes.json'), 'utf8'),
) as ClassData[];

const ATTRS = { STR: 10, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 } as Record<
  AttributeKey,
  number
>;

/** The class as the content API sends it, with only what the proficiencies read. */
const content = (id: string, edition: Edition = '2014') => {
  const data = classes.find((c) => c.id === id);
  if (!data) throw new Error(`no class ${id}`);
  const [subclass] = data.subclasses;
  return {
    classId: id,
    edition,
    hitDie: data.hitDie,
    proficiencies: data.proficiencies,
    spellcasting: data.spellcasting,
    features: data.features,
    subclass: { id: subclass.id },
    subclassFeatures: subclass.features,
  };
};

interface Sheet {
  classId: string | null;
  edition?: Edition;
  level?: number;
  subclassId?: string | null;
  saved?: SavedProficiencies;
}

/** What the sheet shows, as the sheet computes it. */
function shown(sheet: Sheet) {
  const { classId, level = 1, subclassId = null, saved } = sheet;
  // Only a sheet that says nothing about its edition is on 2014 here; `edition: undefined` has none
  const edition = 'edition' in sheet ? sheet.edition : '2014';
  const c = classId ? content(classId) : null;
  return effectiveProficiencies(saved, {
    defaults: classDefaults(edition, c, ATTRS),
    content: c,
    level,
    subclassId,
  });
}

/** The ids (or own texts) of a kind that are on. */
const on = (sheet: Sheet, kind: ProficiencyKind) =>
  shown(sheet)
    [kind].filter((p) => p.active)
    .map((p) => p.id ?? p.text);

describe('proficiências e idiomas efetivos', () => {
  it('Guerreiro: as da classe, com origem na classe', () => {
    const fighter = shown({ classId: 'fighter' });

    expect(fighter.armor.map((p) => p.id)).toEqual(['light', 'medium', 'heavy', 'shield']);
    expect(fighter.weapons.map((p) => p.id)).toEqual(['simple', 'martial']);
    expect(fighter.armor.every((p) => p.origin.type === 'class' && p.active)).toBe(true);
    expect(fighter.languages).toEqual([]);
  });

  it('Druida nível 1 tem Druídico, com origem na característica', () => {
    expect(shown({ classId: 'druid' }).languages).toEqual([
      {
        kind: 'languages',
        id: 'druidic',
        origin: { type: 'feature', feature: 'druidic' },
        active: true,
      },
    ]);
    // E a ferramenta fixa da classe
    expect(on({ classId: 'druid' }, 'tools')).toEqual(['herbalism-kit']);
  });

  it('Ladino nível 1 tem Gíria do Ladrão, com origem na característica', () => {
    expect(shown({ classId: 'rogue' }).languages).toEqual([
      {
        kind: 'languages',
        id: 'thieves-cant',
        origin: { type: 'feature', feature: 'thieves-cant' },
        active: true,
      },
    ]);
  });

  it('Clérigo sem subclasse, com Vida e sem de novo: armadura pesada some, aparece e some', () => {
    expect(on({ classId: 'cleric' }, 'armor')).toEqual(['light', 'medium', 'shield']);

    const life = shown({ classId: 'cleric', subclassId: 'life' });
    expect(life.armor.find((p) => p.id === 'heavy')).toEqual({
      kind: 'armor',
      id: 'heavy',
      origin: { type: 'subclass', feature: 'life-domain' },
      active: true,
    });

    expect(on({ classId: 'cleric', subclassId: null }, 'armor')).not.toContain('heavy');
  });

  it('subclasse que não é a do SRD não dá nada', () => {
    expect(on({ classId: 'cleric', subclassId: 'war' }, 'armor')).not.toContain('heavy');
  });

  it.each([
    ['sem edição', { edition: undefined }],
    ['em 2024', { edition: '2024' as const }],
  ])('%s: nada vem da classe, só o que a pessoa adicionou', (_, extra) => {
    const saved: SavedProficiencies = { languages: { added: ['elvish'], own: ['Aquan'] } };
    const sheet = shown({ classId: 'druid', ...extra, saved });

    expect(sheet.armor).toEqual([]);
    expect(sheet.languages.map((p) => [p.id ?? p.text, p.origin.type])).toEqual([
      ['elvish', 'chosen'],
      ['Aquan', 'own'],
    ]);
  });

  it('classe escrita à mão: só o que a pessoa adicionou', () => {
    expect(
      on(
        { classId: null, saved: { armor: { added: ['heavy'], own: ['Escudo de torre'] } } },
        'armor',
      ),
    ).toEqual(['heavy', 'Escudo de torre']);
  });

  it('algo que a classe dá e a pessoa também adicionou aparece uma vez, como da classe', () => {
    const fighter = shown({ classId: 'fighter', saved: { armor: { added: ['heavy'] } } });

    expect(fighter.armor.filter((p) => p.id === 'heavy')).toHaveLength(1);
    expect(fighter.armor.find((p) => p.id === 'heavy')?.origin).toEqual({ type: 'class' });
  });
});

describe('o que a ficha guarda', () => {
  it('guarda o id, nunca o nome; o texto próprio fica como foi digitado', () => {
    let saved = addProficiency(undefined, 'languages', 'elvish');
    saved = addOwnProficiency(saved, 'languages', '  Língua dos Corvos ');

    expect(saved).toEqual({ languages: { added: ['elvish'], own: ['Língua dos Corvos'] } });
    // Repetir não duplica; texto vazio não entra
    saved = addProficiency(saved, 'languages', 'elvish');
    saved = addOwnProficiency(saved, 'languages', 'Língua dos Corvos');
    saved = addOwnProficiency(saved, 'languages', '   ');
    expect(saved).toEqual({ languages: { added: ['elvish'], own: ['Língua dos Corvos'] } });
  });

  it('o padrão da classe nunca é gravado', () => {
    // Nenhuma edição grava o que a classe dá: sem mexer, nada salvo
    expect(shown({ classId: 'fighter', saved: undefined }).armor).toHaveLength(4);
    expect(addProficiency(undefined, 'tools', 'lute')).toEqual({ tools: { added: ['lute'] } });
  });

  it('desligar uma da classe e religar', () => {
    const heavy = shown({ classId: 'fighter' }).armor.find((p) => p.id === 'heavy')!;

    const off = removeProficiency(undefined, heavy);
    expect(off).toEqual({ armor: { off: ['heavy'] } });
    const turnedOff = shown({ classId: 'fighter', saved: off }).armor.find((p) => p.id === 'heavy');
    expect(turnedOff).toMatchObject({ active: false, origin: { type: 'class' } });

    const back = restoreProficiency(off, 'armor', 'heavy');
    expect(back).toEqual({});
    expect(on({ classId: 'fighter', saved: back }, 'armor')).toContain('heavy');
  });

  it('adicionar uma que a classe dá e estava desligada religa', () => {
    const saved = addProficiency({ armor: { off: ['heavy'] } }, 'armor', 'heavy');

    expect(on({ classId: 'fighter', saved }, 'armor')).toContain('heavy');
  });

  it('desligar Druídico vale como para as da classe', () => {
    const druidic = shown({ classId: 'druid' }).languages[0];
    const saved = removeProficiency(undefined, druidic);

    expect(saved).toEqual({ languages: { off: ['druidic'] } });
    expect(shown({ classId: 'druid', saved }).languages[0].active).toBe(false);
  });

  it('remover uma adicionada ou própria tira só ela', () => {
    const saved: SavedProficiencies = {
      tools: { added: ['lute', 'flute'], own: ['Kit de cartas marcadas'] },
    };
    const entries = shown({ classId: null, saved }).tools;

    const noLute = removeProficiency(saved, entries[0]);
    expect(noLute).toEqual({ tools: { added: ['flute'], own: ['Kit de cartas marcadas'] } });
    const noOwn = removeProficiency(noLute, entries[2]);
    expect(noOwn).toEqual({ tools: { added: ['flute'] } });
  });

  it('trocar de classe mantém as adicionadas e as próprias', () => {
    const saved: SavedProficiencies = {
      armor: { added: ['heavy'] },
      languages: { added: ['elvish'], own: ['Língua dos Corvos'] },
      tools: { own: ['Kit de navegação estelar'] },
    };

    for (const classId of ['wizard', 'fighter', 'rogue', 'wizard']) {
      const sheet = shown({ classId, saved });
      expect(
        sheet.languages.filter((p) => p.origin.type !== 'feature').map((p) => p.id ?? p.text),
      ).toEqual(['elvish', 'Língua dos Corvos']);
      expect(on({ classId, saved }, 'armor')).toContain('heavy');
      expect(on({ classId, saved }, 'tools')).toContain('Kit de navegação estelar');
    }
    // No Mago a armadura pesada é escolha; no Guerreiro, da classe
    expect(shown({ classId: 'wizard', saved }).armor[0].origin.type).toBe('chosen');
    expect(
      shown({ classId: 'fighter', saved }).armor.find((p) => p.id === 'heavy')?.origin,
    ).toEqual({
      type: 'class',
    });
  });
});

describe('dados das concessões por característica', () => {
  it('toda característica citada existe na classe ou subclasse do SRD 5.1', () => {
    for (const [classId, list] of Object.entries(FEATURE_GRANTS)) {
      const features = content(classId).features.map((f) => f.id);
      for (const grant of list) expect(features).toContain(grant.feature);
    }
    for (const [key, list] of Object.entries(SUBCLASS_GRANTS)) {
      const [classId, subclassId] = key.split('/');
      const c = content(classId);
      expect(c.subclass.id).toBe(subclassId);
      for (const grant of list)
        expect(c.subclassFeatures.map((f) => f.id)).toContain(grant.feature);
    }
  });

  it('todo id concedido está no catálogo do tipo', () => {
    const grants = [...Object.values(FEATURE_GRANTS), ...Object.values(SUBCLASS_GRANTS)].flat();
    for (const grant of grants) {
      if (grant.kind === 'languages') expect(LANGUAGE_IDS).toContain(grant.id);
      if (grant.kind === 'armor') expect(ARMOR_IDS).toContain(grant.id);
    }
  });
});

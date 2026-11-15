import { describe, expect, it } from 'vitest';

import { type DraftPatch, resolvePatch } from '@frontend/hooks/useDraft';

import { RESOURCE_KEY } from '@shared/systems/dnd5e/class-resources';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import {
  addCustomResource,
  editResourceBox,
  hitDiceAvailable,
  newCustomKey,
  removeCustomResource,
  resetResourceBox,
  setAttribute,
  setDeathSaves,
  setHitDiceSpent,
  setHitDie,
  setLevel,
  setResourceHidden,
  setResourceUsed,
  setSavingThrow,
  setSkill,
  setSpellPoints,
  setSpellSlots,
} from './character-sheet-updates';

const character = {
  ...createDnD5eCharacter('owner-1', 'Thor'),
  id: 'char-1',
  passivePerception: 12, // legacy value stored by older versions of the editor
} as DnD5eCharacter;

const apply = (patch: DraftPatch<DnD5eCharacter>) => resolvePatch(patch, character);
/** The character with the patch applied, to chain a second one. */
const resolveAll = (c: DnD5eCharacter, patch: DraftPatch<DnD5eCharacter>): DnD5eCharacter => ({
  ...c,
  ...resolvePatch(patch, c),
});

describe('character sheet patches', () => {
  it('muda só o atributo dado, sem gravar a percepção passiva derivada', () => {
    const patch = apply(setAttribute('WIS', 16));

    expect(patch).toEqual({ attributes: { ...character.attributes, WIS: 16 } });
    expect(character.attributes.WIS).toBe(10);
  });

  it('marca proficiência em perícia e em salvaguarda', () => {
    expect(apply(setSkill('PERCEPTION', { isProficient: true, expertise: true }))).toEqual({
      skills: { ...character.skills, PERCEPTION: { isProficient: true, expertise: true } },
    });
    expect(apply(setSavingThrow('CON', true)).savingThrowProficiencies?.CON).toBe(true);
  });

  it('completa pontos de magia e dados de vida com o valor atual', () => {
    expect(apply(setSpellPoints('max', 12))).toEqual({ spellPoints: { current: 0, max: 12 } });
    expect(apply(setHitDie('d10'))).toEqual({ hitDice: { die: 'd10', spent: 0 } });
  });

  it('troca um nível de espaços sem perder os outros', () => {
    const withSlots = { ...character, spellSlots: { '1': { max: 4, used: 0 } } };
    const patch = (setSpellSlots('2', 3, 1) as (c: DnD5eCharacter) => Partial<DnD5eCharacter>)(
      withSlots,
    );

    expect(patch.spellSlots).toEqual({ '1': { max: 4, used: 0 }, '2': { max: 3, used: 1 } });
  });

  it('grava os testes contra a morte', () => {
    expect(apply(setDeathSaves(2, 1))).toEqual({ deathSaves: { successes: 2, failures: 1 } });
  });

  it('escolher o dado numa ficha sem dados de vida guardados não gasta nenhum', () => {
    const patch = resolvePatch(setHitDie('d10'), { ...character, level: 4, hitDice: undefined });

    expect(patch).toEqual({ hitDice: { die: 'd10', spent: 0 } });
  });

  it('trocar o dado mantém os gastos, também numa ficha no formato antigo', () => {
    const withDice = { ...character, level: 4, hitDice: { die: 'd10' as const, spent: 3 } };
    expect(resolvePatch(setHitDie('d12'), withDice)).toEqual({
      hitDice: { die: 'd12', spent: 3 },
    });

    const legacy = { ...character, level: 4, hitDice: { total: '4d10', current: 1 } };
    expect(resolvePatch(setHitDie('d12'), legacy)).toEqual({ hitDice: { die: 'd12', spent: 3 } });
  });

  it('muda os dados de vida gastos sem perder o dado', () => {
    const withDice = { ...character, level: 4, hitDice: { die: 'd10' as const, spent: 0 } };

    expect(resolvePatch(setHitDiceSpent(2), withDice)).toEqual({
      hitDice: { die: 'd10', spent: 2 },
    });
    // Sheets saved before 2026-11: the die comes from the total, and the new shape is what is saved
    const legacy = { ...character, level: 4, hitDice: { total: '4d10', current: 4 } };
    expect(resolvePatch(setHitDiceSpent(1), legacy)).toEqual({ hitDice: { die: 'd10', spent: 1 } });
  });

  it('sem dado escolhido, grava os gastos sem a chave do dado', () => {
    const patch = apply(setHitDiceSpent(1));

    expect(patch).toEqual({ hitDice: { spent: 1 } });
    expect(patch.hitDice).not.toHaveProperty('die');
  });

  it('marca o uso de uma caixinha sem perder as outras', () => {
    const withBoxes = {
      ...character,
      resources: { 'class:monk:ki': { used: 3, hidden: true }, 'class:monk:x': { used: 1 } },
    };
    const patch = (
      setResourceUsed('class:monk:ki', 1) as (c: DnD5eCharacter) => Partial<DnD5eCharacter>
    )(withBoxes);

    expect(patch.resources).toEqual({
      'class:monk:ki': { used: 1, hidden: true },
      'class:monk:x': { used: 1 },
    });
  });

  describe('subir e descer de nível', () => {
    const at = (level: number, spent?: number) =>
      ({
        ...character,
        level,
        hitDice: spent === undefined ? undefined : { die: 'd8', spent },
      }) as DnD5eCharacter;

    it('muda só o nível: os dados de vida gastos não entram no patch', () => {
      expect(resolvePatch(setLevel(5), at(4, 0))).toEqual({ level: 5 });
      expect(resolvePatch(setLevel(3), at(4, 4))).toEqual({ level: 3 });
      expect(resolvePatch(setLevel(5), at(4))).toEqual({ level: 5 });
    });

    it('subir traz o dado novo já disponível', () => {
      const leveled = resolveAll(at(5, 2), setLevel(6));

      expect(resolvePatch(setLevel(6), at(5, 2))).not.toHaveProperty('hitDice');
      expect(hitDiceAvailable(leveled)).toBe(4);
    });

    it('descer limita aos dados do novo nível, sem ficar negativo', () => {
      expect(hitDiceAvailable(resolveAll(at(4, 0), setLevel(3)))).toBe(3);
      expect(hitDiceAvailable(resolveAll(at(4, 4), setLevel(1)))).toBe(0);
    });

    it('nível 5 com 0 dados restantes → nível 3 → nível 5 = 0 dados restantes', () => {
      const down = resolveAll(at(5, 5), setLevel(3));
      expect(hitDiceAvailable(down)).toBe(0);
      // What was spent stays as saved, so going back up brings the sheet back as it was
      expect(down.hitDice).toEqual({ die: 'd8', spent: 5 });

      const backUp = resolveAll(down, setLevel(5));
      expect(hitDiceAvailable(backUp)).toBe(0);
      expect(backUp.hitDice).toEqual({ die: 'd8', spent: 5 });
    });

    it('ficha no formato antigo mostra os mesmos dados restantes no nível em que foi salva', () => {
      const legacy = { ...character, level: 5, hitDice: { total: '5d8', current: 3 } };

      expect(hitDiceAvailable(legacy)).toBe(3);
    });
  });

  it('ficha que nunca marcou os dados tem todos os do nível', () => {
    expect(hitDiceAvailable({ level: 4, hitDice: undefined })).toBe(4);
    expect(hitDiceAvailable({ level: 4, hitDice: { spent: 9 } })).toBe(0);
  });
});

describe('editar caixinhas de recurso', () => {
  const KI = 'class:monk:ki';
  const OWN = 'custom:0193a1b2-0000-7000-8000-000000000001';
  const LONG = [{ rest: 'long' as const, amount: 'all' as const }];
  const ring = { name: 'Anel', max: 2, recovery: LONG, source: 'item' as const };
  const withResources = (resources: DnD5eCharacter['resources']) => ({ ...character, resources });
  const on = (c: DnD5eCharacter, patch: DraftPatch<DnD5eCharacter>) =>
    resolvePatch(patch, c).resources;

  it('numa caixinha da classe, a edição fica à parte e os usos continuam', () => {
    const c = withResources({ [KI]: { used: 2 } });

    expect(on(c, editResourceBox(KI, { max: 7, color: '#ef4444' }))).toEqual({
      [KI]: { used: 2, overrides: { max: 7, color: '#ef4444' } },
    });
  });

  it('limpar um campo volta a seguir a classe, e sem edição nenhuma não sobra nada', () => {
    const c = withResources({ [KI]: { used: 2, overrides: { max: 7, name: 'Chi' } } });

    expect(on(c, editResourceBox(KI, { max: undefined }))).toEqual({
      [KI]: { used: 2, overrides: { name: 'Chi' } },
    });
    const cleared = on(
      resolveAll(c, editResourceBox(KI, { max: undefined })),
      editResourceBox(KI, { name: '' }),
    );
    expect(cleared).toEqual({ [KI]: { used: 2 } });
  });

  it('caixinha da classe nunca gasta ganha a edição com 0 usados, e ignora a origem', () => {
    expect(on(character, editResourceBox(KI, { description: 'Meu', source: 'item' }))).toEqual({
      [KI]: { used: 0, overrides: { description: 'Meu' } },
    });
  });

  it('numa caixinha própria, a edição muda a própria caixinha', () => {
    const c = withResources({ [OWN]: { used: 1, custom: { ...ring, color: '#ef4444' } } });

    expect(on(c, editResourceBox(OWN, { name: 'Anel de fogo', max: 3, source: 'feat' }))).toEqual({
      [OWN]: {
        used: 1,
        custom: { ...ring, name: 'Anel de fogo', max: 3, source: 'feat', color: '#ef4444' },
      },
    });
    // Clearing the color goes back to the sheet's; the box keeps what it must always have
    expect(on(c, editResourceBox(OWN, { color: undefined, max: undefined }))).toEqual({
      [OWN]: { used: 1, custom: ring },
    });
  });

  it('esconder e mostrar não mexem no resto', () => {
    const c = withResources({ [KI]: { used: 2, overrides: { max: 7 } } });
    const hidden = resolveAll(c, setResourceHidden(KI, true));

    expect(hidden.resources).toEqual({ [KI]: { used: 2, overrides: { max: 7 }, hidden: true } });
    expect(on(hidden, setResourceHidden(KI, false))).toEqual(c.resources);
  });

  it('voltar ao padrão tira só as edições', () => {
    const c = withResources({ [KI]: { used: 2, hidden: true, overrides: { max: 7 } } });
    expect(on(c, resetResourceBox(KI))).toEqual({ [KI]: { used: 2, hidden: true } });
  });

  it('criar põe a caixinha com 0 usados; excluir deixa a chave sem caixinha', () => {
    const added = resolveAll(character, addCustomResource(OWN, ring));
    expect(added.resources).toEqual({ [OWN]: { used: 0, custom: ring } });
    expect(on(added, removeCustomResource(OWN))).toEqual({ [OWN]: { used: 0 } });
  });

  it('a chave nova é aceita pelo servidor e ordena pela hora em que foi criada', () => {
    const first = newCustomKey(1_700_000_000_000);
    const second = newCustomKey(1_700_000_000_001);

    expect(first).toMatch(RESOURCE_KEY);
    expect(first < second).toBe(true);
    expect(newCustomKey(1_700_000_000_000)).not.toBe(first);
  });
});

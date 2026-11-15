import { describe, expect, it } from 'vitest';

import { type DraftPatch, resolvePatch } from '@frontend/hooks/useDraft';

import { RESOURCE_KEY } from '@shared/systems/dnd5e/class-resources';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import {
  addCustomResource,
  editResourceBox,
  hitDieSides,
  newCustomKey,
  removeCustomResource,
  resetResourceBox,
  setAttribute,
  setDeathSaves,
  setHitDice,
  setHitDiceRemaining,
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
    expect(apply(setHitDice('5d10'))).toEqual({
      hitDice: { total: '5d10', current: character.level },
    });
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

  it('dados de vida sem valor salvo começam cheios, no nível do personagem', () => {
    const patch = (setHitDice('d10') as (c: DnD5eCharacter) => Partial<DnD5eCharacter>)({
      ...character,
      level: 4,
      hitDice: undefined,
    });

    expect(patch).toEqual({ hitDice: { total: 'd10', current: 4 } });
  });

  it('muda os dados de vida restantes sem perder o total', () => {
    const withDice = { ...character, hitDice: { total: '4d10', current: 4 } };
    const patch = (setHitDiceRemaining(2) as (c: DnD5eCharacter) => Partial<DnD5eCharacter>)(
      withDice,
    );

    expect(patch).toEqual({ hitDice: { total: '4d10', current: 2 } });
    expect(apply(setHitDiceRemaining(1))).toEqual({ hitDice: { total: '', current: 1 } });
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
    const at = (level: number, current?: number) =>
      ({
        ...character,
        level,
        hitDice: current === undefined ? undefined : { total: `${level}d8`, current },
      }) as DnD5eCharacter;

    it('subir traz o dado novo já disponível', () => {
      expect(resolvePatch(setLevel(5), at(4, 4))).toEqual({
        level: 5,
        hitDice: { total: '4d8', current: 5 },
      });
      expect(resolvePatch(setLevel(6), at(4, 1))).toEqual({
        level: 6,
        hitDice: { total: '4d8', current: 3 },
      });
    });

    it('descer limita aos dados do novo nível, sem ficar negativo', () => {
      expect(resolvePatch(setLevel(3), at(4, 4)).hitDice?.current).toBe(3);
      expect(resolvePatch(setLevel(1), at(4, 0)).hitDice?.current).toBe(0);
    });

    it('ficha que nunca marcou os dados só muda o nível', () => {
      expect(resolvePatch(setLevel(5), at(4))).toEqual({ level: 5 });
    });
  });

  it('lê os lados do dado de vida no total', () => {
    expect(hitDieSides('5d10')).toBe(10);
    expect(hitDieSides('d6')).toBe(6);
    expect(hitDieSides('')).toBeNull();
    expect(hitDieSides(undefined)).toBeNull();
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

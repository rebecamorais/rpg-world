import { beforeEach, describe, expect, it } from 'vitest';

import { getClassCatalog } from '@backend/contexts/classes/infrastructure/srd-classes';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import type { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { CreateCharacterUseCase } from './create-character.use-case';

describe('CreateCharacterUseCase ', () => {
  let repo: InMemoryCharacterRepository;
  let useCase: CreateCharacterUseCase;

  beforeEach(() => {
    repo = new InMemoryCharacterRepository();
    useCase = new CreateCharacterUseCase(repo, getClassCatalog());
  });

  it('deve criar e salvar um personagem com sucesso', async () => {
    const character = await useCase.execute({
      id: 'char-new',
      name: 'Gimli',
      ownerUsername: 'user1',
      system: 'DnD_5e',
      class: 'Fighter',
      race: 'Dwarf',
      level: 1,
    });

    expect(character.id).toBe('char-new');
    expect(character.name).toBe('Gimli');

    const saved = await repo.findById('char-new');
    expect(saved).not.toBeNull();
    expect(saved!.name).toBe('Gimli');
  });

  it('não deve permitir criar personagem sem nome', async () => {
    await expect(
      useCase.execute({
        id: 'id1',
        name: '   ',
        ownerUsername: 'u',
        system: 'D',
        class: 'C',
        race: 'R',
        level: 1,
      }),
    ).rejects.toThrowError(CharacterErrorCodes.CREATE_NAME_REQUIRED);
  });

  it('tira espaços do nome e usa nível 1, sem classe e sem raça por padrão', async () => {
    const character = await useCase.execute({
      id: 'char-defaults',
      name: '  Legolas  ',
      ownerUsername: 'user1',
      system: 'DnD_5e',
    });

    expect(character.toJSON()).toMatchObject({
      name: 'Legolas',
      level: 1,
      class: '',
      race: '',
    });
  });

  it('cria ficha de inimigo com kind npc; sem kind é pc', async () => {
    await useCase.execute({ id: 'npc-1', name: 'Goblin', ownerUsername: 'gm', kind: 'npc' });
    await useCase.execute({ id: 'pc-1', name: 'Arani', ownerUsername: 'gm' });

    expect((await repo.findById('npc-1'))!.kind).toBe('npc');
    expect((await repo.findById('pc-1'))!.kind).toBe('pc');
  });

  describe('com classe', () => {
    const create = (input: Partial<Parameters<typeof useCase.execute>[0]>) =>
      useCase.execute({ id: 'char-class', name: 'Hero', ownerUsername: 'user1', ...input });
    const saved = async () => (await repo.findById('char-class')) as DnD5eCharacter;

    it.each([
      ['barbarian', 12],
      ['bard', 8],
      ['cleric', 8],
      ['wizard', 6],
    ])('%s em 2014: PV do nível 1 é o máximo do dado + CON (10 → +0)', async (cls, hp) => {
      await create({ edition: '2014', class: cls });

      const character = await saved();
      expect(character.hp.max).toBe(hp);
      expect(character.hp.current).toBe(hp);
      expect(character.edition).toBe('2014');
      expect(character.class).toBe(cls);
    });

    it('não grava o padrão da classe: salvaguardas e dado de vida seguem a classe', async () => {
      await create({ edition: '2014', class: 'barbarian' });

      const character = await saved();
      expect(character.savingThrowProficiencies).toEqual({});
      expect(character.hitDice).toBeUndefined();
      expect(character.skills).toEqual({});
      // Empty, but present: the sheet is born with class picks, so the open ones show
      expect(character.classChoices).toEqual({});
    });

    it('grava as perícias escolhidas, marcadas e sob a identidade da escolha', async () => {
      await create({
        edition: '2014',
        class: 'bard',
        classChoices: {
          '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'],
          '2014/bard/tools': ['lute', 'flute'],
        },
      });

      const character = await saved();
      expect(character.skills).toEqual({
        ARCANA: { isProficient: true },
        HISTORY: { isProficient: true },
        STEALTH: { isProficient: true },
      });
      expect(character.classChoices).toEqual({
        '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'],
        '2014/bard/tools': ['lute', 'flute'],
      });
    });

    it('cria com a escolha incompleta: 2 de 3 perícias', async () => {
      await create({
        edition: '2014',
        class: 'bard',
        classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY'] },
      });

      expect((await saved()).classChoices).toEqual({ '2014/bard/skills': ['ARCANA', 'HISTORY'] });
    });

    it('escolha inválida: perícia fora da lista da classe fica de fora', async () => {
      await create({
        edition: '2014',
        class: 'barbarian',
        // Arcana is not a Barbarian's, and a lute is not a skill
        classChoices: { '2014/barbarian/skills': ['ARCANA', 'ATHLETICS', 'lute'] },
      });

      const character = await saved();
      expect(character.skills).toEqual({ ATHLETICS: { isProficient: true } });
      expect(character.classChoices).toEqual({ '2014/barbarian/skills': ['ATHLETICS'] });
    });

    it('escolha repetida conta uma vez', async () => {
      await create({
        edition: '2014',
        class: 'barbarian',
        classChoices: { '2014/barbarian/skills': ['ATHLETICS', 'ATHLETICS'] },
      });

      expect((await saved()).classChoices).toEqual({ '2014/barbarian/skills': ['ATHLETICS'] });
    });

    it('escolha em excesso: só entram as primeiras, até a quantidade pedida', async () => {
      await create({
        edition: '2014',
        class: 'barbarian',
        classChoices: {
          '2014/barbarian/skills': ['ATHLETICS', 'NATURE', 'SURVIVAL'],
        },
      });

      const character = await saved();
      expect(character.classChoices).toEqual({ '2014/barbarian/skills': ['ATHLETICS', 'NATURE'] });
      expect(Object.keys(character.skills)).toEqual(['ATHLETICS', 'NATURE']);
    });

    it('escolha de outra classe ou de ferramenta fora do tipo fica de fora', async () => {
      await create({
        edition: '2014',
        class: 'bard',
        classChoices: {
          '2014/rogue/skills': ['STEALTH'],
          '2014/bard/tools': ['smith-s-tools', 'lute'],
        },
      });

      const character = await saved();
      expect(character.skills).toEqual({});
      expect(character.classChoices).toEqual({ '2014/bard/tools': ['lute'] });
    });

    it.each([
      ['sem edição', { class: 'bard' }],
      ['em 2024', { edition: '2024' as const, class: 'bard' }],
      ['com classe escrita à mão', { edition: '2014' as const, class: 'Bardo das Sombras' }],
    ])('%s: a ficha de hoje, sem PV da classe nem escolhas', async (_case, input) => {
      await create({ ...input, classChoices: { '2014/bard/skills': ['ARCANA'] } });

      const character = await saved();
      expect(character.hp.max).toBe(10);
      expect(character.skills).toEqual({});
      expect(character.classChoices).toBeUndefined();
    });

    it('sem nome não cria, mesmo com as escolhas feitas', async () => {
      await expect(
        create({
          name: '  ',
          edition: '2014',
          class: 'bard',
          classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] },
        }),
      ).rejects.toThrowError(CharacterErrorCodes.CREATE_NAME_REQUIRED);
      expect(await repo.findById('char-class')).toBeNull();
    });
  });
});

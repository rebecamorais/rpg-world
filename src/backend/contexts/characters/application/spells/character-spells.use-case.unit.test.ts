import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { CharacterSpellRepo } from '../../domain/repository/character-spell.repo';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { GetCharacterSpellsUseCase } from './get-character-spells.use-case';
import { ToggleCharacterSpellUseCase, ToggleSpellAction } from './toggle-character-spell.use-case';

const FIREBALL = 'dnd5e:srd-5.1:spell:fireball';

const makeCatalog = () => ({
  findByKeys: vi.fn(async (keys: string[]) =>
    keys
      .filter((key) => key === FIREBALL)
      .map((id) => ({
        id,
        name: 'Fireball',
        level: 3,
        school: 'evocation',
        classes: [],
        components: [],
      })),
  ),
});

const makeSpellRepo = () =>
  ({
    findByCharacterId: vi.fn().mockResolvedValue([]),
    learn: vi.fn(),
    forget: vi.fn(),
    togglePrepared: vi.fn(),
  }) satisfies CharacterSpellRepo;

describe('character spells use cases', () => {
  let characterRepo: InMemoryCharacterRepository;
  let spellRepo: ReturnType<typeof makeSpellRepo>;
  let catalog: ReturnType<typeof makeCatalog>;

  beforeEach(async () => {
    characterRepo = new InMemoryCharacterRepository();
    spellRepo = makeSpellRepo();
    catalog = makeCatalog();
    await characterRepo.save(
      new DnD5eCharacter({
        id: 'char-1',
        name: 'Mage',
        ownerUsername: 'owner-1',
        attributes: new Attributes(),
        hp: new HealthPoints(10, 10),
        level: 1,
      }),
    );
  });

  describe('GetCharacterSpellsUseCase', () => {
    it('lista as magias do personagem do dono, resolvidas pelo catálogo', async () => {
      spellRepo.findByCharacterId.mockResolvedValue([
        { ref: FIREBALL, isPrepared: true, createdAt: '2026-10-21' },
      ]);
      const useCase = new GetCharacterSpellsUseCase(characterRepo, spellRepo, catalog);

      const spells = await useCase.execute('char-1', 'owner-1', 'pt');

      expect(spellRepo.findByCharacterId).toHaveBeenCalledWith('char-1');
      expect(catalog.findByKeys).toHaveBeenCalledWith([FIREBALL], 'pt');
      expect(spells).toEqual([
        expect.objectContaining({ id: FIREBALL, name: 'Fireball', isPrepared: true }),
      ]);
    });

    it('omite magia que não existe mais no catálogo', async () => {
      spellRepo.findByCharacterId.mockResolvedValue([
        { ref: 'dnd5e:srd-5.1:spell:gone', isPrepared: false },
        { ref: FIREBALL, isPrepared: false },
      ]);
      const useCase = new GetCharacterSpellsUseCase(characterRepo, spellRepo, catalog);

      const spells = await useCase.execute('char-1', 'owner-1');

      expect(spells.map((s) => s.id)).toEqual([FIREBALL]);
    });

    it('responde not found para outro usuário sem consultar as magias', async () => {
      const useCase = new GetCharacterSpellsUseCase(characterRepo, spellRepo, catalog);
      await expect(useCase.execute('char-1', 'intruder')).rejects.toThrow(
        CharacterErrorCodes.ACCESS_NOT_FOUND,
      );
      expect(spellRepo.findByCharacterId).not.toHaveBeenCalled();
    });
  });

  describe('ToggleCharacterSpellUseCase', () => {
    it.each([
      ['learn', 'learn', ['char-1', FIREBALL]],
      ['forget', 'forget', ['char-1', FIREBALL]],
      ['prepare', 'togglePrepared', ['char-1', FIREBALL, true]],
      ['unprepare', 'togglePrepared', ['char-1', FIREBALL, false]],
    ] as const)('executa %s para o dono', async (action, method, args) => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo, catalog);
      await useCase.execute('char-1', 'owner-1', FIREBALL, action);
      expect(spellRepo[method]).toHaveBeenCalledWith(...args);
    });

    it('proíbe outro usuário de alterar as magias', async () => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo, catalog);
      await expect(useCase.execute('char-1', 'intruder', FIREBALL, 'learn')).rejects.toThrow(
        CharacterErrorCodes.ACCESS_FORBIDDEN,
      );
      expect(spellRepo.learn).not.toHaveBeenCalled();
    });

    it('não aprende magia que não existe no catálogo', async () => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo, catalog);
      await expect(
        useCase.execute('char-1', 'owner-1', 'dnd5e:srd-5.1:spell:nope', 'learn'),
      ).rejects.toThrow(CharacterErrorCodes.SPELL_NOT_FOUND);
      expect(spellRepo.learn).not.toHaveBeenCalled();
    });

    it('rejeita ação desconhecida', async () => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo, catalog);
      await expect(
        useCase.execute('char-1', 'owner-1', FIREBALL, 'drop' as ToggleSpellAction),
      ).rejects.toThrow(CharacterErrorCodes.SPELL_ACTION_INVALID);
    });
  });
});

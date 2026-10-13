import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { CharacterSpellRepo } from '../../domain/repository/character-spell.repo';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { GetCharacterSpellsUseCase } from './get-character-spells.use-case';
import { ToggleCharacterSpellUseCase, ToggleSpellAction } from './toggle-character-spell.use-case';

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

  beforeEach(async () => {
    characterRepo = new InMemoryCharacterRepository();
    spellRepo = makeSpellRepo();
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
    it('lista as magias do personagem do dono', async () => {
      const useCase = new GetCharacterSpellsUseCase(characterRepo, spellRepo);
      await useCase.execute('char-1', 'owner-1', 'pt');
      expect(spellRepo.findByCharacterId).toHaveBeenCalledWith('char-1', 'pt');
    });

    it('responde not found para outro usuário sem consultar as magias', async () => {
      const useCase = new GetCharacterSpellsUseCase(characterRepo, spellRepo);
      await expect(useCase.execute('char-1', 'intruder')).rejects.toThrow(
        CharacterErrorCodes.ACCESS_NOT_FOUND,
      );
      expect(spellRepo.findByCharacterId).not.toHaveBeenCalled();
    });
  });

  describe('ToggleCharacterSpellUseCase', () => {
    it.each([
      ['learn', 'learn', ['char-1', 'fireball']],
      ['forget', 'forget', ['char-1', 'fireball']],
      ['prepare', 'togglePrepared', ['char-1', 'fireball', true]],
      ['unprepare', 'togglePrepared', ['char-1', 'fireball', false]],
    ] as const)('executa %s para o dono', async (action, method, args) => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo);
      await useCase.execute('char-1', 'owner-1', 'fireball', action);
      expect(spellRepo[method]).toHaveBeenCalledWith(...args);
    });

    it('proíbe outro usuário de alterar as magias', async () => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo);
      await expect(useCase.execute('char-1', 'intruder', 'fireball', 'learn')).rejects.toThrow(
        CharacterErrorCodes.ACCESS_FORBIDDEN,
      );
      expect(spellRepo.learn).not.toHaveBeenCalled();
    });

    it('rejeita ação desconhecida', async () => {
      const useCase = new ToggleCharacterSpellUseCase(characterRepo, spellRepo);
      await expect(
        useCase.execute('char-1', 'owner-1', 'fireball', 'drop' as ToggleSpellAction),
      ).rejects.toThrow(CharacterErrorCodes.SPELL_ACTION_INVALID);
    });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CharacterOwnership } from '../domain/CharacterOwnership';
import { Lore } from '../domain/Lore';
import { LoreErrorCodes } from '../domain/LoreError';
import { LoreRepository } from '../domain/repository/lore.repo';
import { DeleteLoreUseCase } from './delete-lore/delete-lore.use-case';
import { GetLoreUseCase } from './get-lore/get-lore.use-case';
import { GetPartyLoreUseCase } from './get-lore/get-party-lore.use-case';
import { UpdateLoreUseCase } from './update-lore/update-lore.use-case';

const makeRepository = () =>
  ({
    findByCharacterId: vi.fn().mockResolvedValue(new Lore('30')),
    save: vi.fn(),
    delete: vi.fn(),
  }) satisfies LoreRepository;

describe('lore use cases', () => {
  let repository: ReturnType<typeof makeRepository>;
  let ownership: CharacterOwnership;

  beforeEach(() => {
    repository = makeRepository();
    ownership = {
      isOwner: vi.fn(
        async (characterId, userId) => characterId === 'char-1' && userId === 'owner-1',
      ),
    };
  });

  describe('GetLoreUseCase', () => {
    it('retorna a lore para o dono do personagem', async () => {
      const lore = await new GetLoreUseCase(repository, ownership).execute('char-1', 'owner-1');
      expect(lore?.age).toBe('30');
    });

    it('responde not found para outro usuário sem consultar a lore', async () => {
      const error = await new GetLoreUseCase(repository, ownership)
        .execute('char-1', 'intruder')
        .catch((e) => e);

      expect(error.code).toBe(LoreErrorCodes.CHARACTER_NOT_FOUND);
      expect(error.kind).toBe('not_found');
      expect(repository.findByCharacterId).not.toHaveBeenCalled();
    });
  });

  describe('UpdateLoreUseCase', () => {
    it('salva a lore para o dono do personagem', async () => {
      const lore = new Lore('31');
      await new UpdateLoreUseCase(repository, ownership).execute('char-1', 'owner-1', lore);
      expect(repository.save).toHaveBeenCalledWith('char-1', lore);
    });

    it('não salva a lore de personagem de outro usuário', async () => {
      await expect(
        new UpdateLoreUseCase(repository, ownership).execute('char-1', 'intruder', new Lore()),
      ).rejects.toThrow(LoreErrorCodes.CHARACTER_NOT_FOUND);
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('DeleteLoreUseCase', () => {
    it('remove a lore para o dono do personagem', async () => {
      await new DeleteLoreUseCase(repository, ownership).execute('char-1', 'owner-1');
      expect(repository.delete).toHaveBeenCalledWith('char-1');
    });

    it('não remove a lore de personagem inexistente', async () => {
      await expect(
        new DeleteLoreUseCase(repository, ownership).execute('missing', 'owner-1'),
      ).rejects.toThrow(LoreErrorCodes.CHARACTER_NOT_FOUND);
      expect(repository.delete).not.toHaveBeenCalled();
    });
  });

  describe('GetPartyLoreUseCase', () => {
    const access = {
      isGmOfCharacter: vi.fn(
        async (partyId: string, characterId: string, userId: string) =>
          partyId === 'party-1' && characterId === 'char-1' && userId === 'gm-1',
      ),
    };

    it('o mestre da mesa lê a lore', async () => {
      const lore = await new GetPartyLoreUseCase(repository, access).execute(
        'party-1',
        'char-1',
        'gm-1',
      );
      expect(lore?.age).toBe('30');
    });

    it('sem acesso responde not found sem consultar a lore', async () => {
      const error = await new GetPartyLoreUseCase(repository, access)
        .execute('party-1', 'char-1', 'player-2')
        .catch((e) => e);

      expect(error.code).toBe(LoreErrorCodes.CHARACTER_NOT_FOUND);
      expect(repository.findByCharacterId).not.toHaveBeenCalled();
    });
  });
});

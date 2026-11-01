import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartyGmAccess } from '@backend/shared/domain/PartyGmAccess';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { CharacterSpellRepo, SpellLookup } from '../../domain/repository/character-spell.repo';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { GetPartyCharacterSpellsUseCase } from './get-party-character-spells.use-case';
import { GetPartyCharacterUseCase } from './get-party-character.use-case';

describe('leitura da ficha pelo mestre da mesa', () => {
  let repo: InMemoryCharacterRepository;
  let access: PartyGmAccess;

  beforeEach(async () => {
    repo = new InMemoryCharacterRepository();
    await repo.save(
      new DnD5eCharacter({
        id: 'char-1',
        name: 'Arani',
        ownerUsername: 'player-1',
        attributes: new Attributes(),
        hp: new HealthPoints(10, 10),
        level: 1,
      }),
    );
    access = {
      isGmOfCharacter: vi.fn(
        async (partyId, characterId, userId) =>
          partyId === 'party-1' && characterId === 'char-1' && userId === 'gm-1',
      ),
    };
  });

  describe('GetPartyCharacterUseCase', () => {
    it('com acesso devolve a ficha', async () => {
      const character = await new GetPartyCharacterUseCase(repo, access).execute(
        'party-1',
        'char-1',
        'gm-1',
      );
      expect(character.name).toBe('Arani');
    });

    it('sem acesso responde not found, sem ler o repositório', async () => {
      const findById = vi.spyOn(repo, 'findById');

      const error = await new GetPartyCharacterUseCase(repo, access)
        .execute('party-1', 'char-1', 'intruder')
        .catch((e) => e);

      expect(error.code).toBe(CharacterErrorCodes.GET_NOT_FOUND);
      expect(error.kind).toBe('not_found');
      expect(findById).not.toHaveBeenCalled();
    });

    it('com acesso mas personagem sumido (apagado) responde not found', async () => {
      await repo.delete('char-1');

      await expect(
        new GetPartyCharacterUseCase(repo, access).execute('party-1', 'char-1', 'gm-1'),
      ).rejects.toThrow(CharacterErrorCodes.GET_NOT_FOUND);
    });
  });

  describe('GetPartyCharacterSpellsUseCase', () => {
    const spellRepository = {
      findByCharacterId: vi
        .fn()
        .mockResolvedValue([
          { ref: 'dnd5e:srd-5.1:spell:fireball', isPrepared: true, createdAt: 'x' },
        ]),
      learn: vi.fn(),
      forget: vi.fn(),
      togglePrepared: vi.fn(),
    } as unknown as CharacterSpellRepo;
    const catalog = {
      findByKeys: vi.fn(async (keys: string[]) => keys.map((id) => ({ id, name: id }))),
    } as unknown as SpellLookup;

    it('com acesso devolve as magias', async () => {
      const spells = await new GetPartyCharacterSpellsUseCase(
        spellRepository,
        catalog,
        access,
      ).execute('party-1', 'char-1', 'gm-1');

      expect(spells).toEqual([
        expect.objectContaining({ id: 'dnd5e:srd-5.1:spell:fireball', isPrepared: true }),
      ]);
    });

    it('sem acesso responde not found', async () => {
      const error = await new GetPartyCharacterSpellsUseCase(spellRepository, catalog, access)
        .execute('party-1', 'char-1', 'player-2')
        .catch((e) => e);

      expect(error.code).toBe(CharacterErrorCodes.ACCESS_NOT_FOUND);
    });
  });
});

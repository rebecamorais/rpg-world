import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ItemDto } from '@backend/contexts/items/domain/item.repo';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { DnD5eCharacter } from '../../domain/entity/DnD5eCharacter';
import { InventoryRepo } from '../../domain/repository/inventory.repo';
import { Attributes } from '../../domain/value-object/Attributes';
import { HealthPoints } from '../../domain/value-object/HealthPoints';
import { InMemoryCharacterRepository } from '../../infrastructure/in-memory-character.repository';
import { GetPartyCharacterInventoryUseCase } from '../party-gm/get-party-character-inventory.use-case';
import {
  AddInventoryItemUseCase,
  ChangeInventoryCoinsUseCase,
  ChangeInventoryItemQuantityUseCase,
  GetInventoryUseCase,
  RemoveInventoryItemUseCase,
  SetInventoryCoinsUseCase,
  SetInventoryItemQuantityUseCase,
} from './inventory.use-cases';

const ROPE = 'dnd5e:srd-5.2:item:rope';
const GONE = 'dnd5e:srd-5.2:item:gone';
const COINS = { cp: 0, sp: 0, ep: 0, gp: 5, pp: 0 };

const rope = { key: ROPE, id: 'rope', name: 'Rope' } as ItemDto;

const makeCatalog = () => ({
  find: vi.fn((key: string) => (key === ROPE ? rope : null)),
  findByKeys: vi.fn((keys: string[]) => keys.filter((key) => key === ROPE).map(() => rope)),
});

const makeRepo = () =>
  ({
    find: vi.fn().mockResolvedValue({ containers: [], items: [] }),
    addItem: vi.fn(),
    setQuantity: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    setCoins: vi.fn().mockResolvedValue(true),
    changeQuantity: vi.fn<InventoryRepo['changeQuantity']>().mockResolvedValue(3),
    changeCoins: vi.fn<InventoryRepo['changeCoins']>().mockResolvedValue(COINS),
    setCoinsIfUnchanged: vi.fn<InventoryRepo['setCoinsIfUnchanged']>().mockResolvedValue(COINS),
  }) satisfies InventoryRepo;

describe('inventory use cases', () => {
  let characters: InMemoryCharacterRepository;
  let repo: ReturnType<typeof makeRepo>;
  let catalog: ReturnType<typeof makeCatalog>;

  beforeEach(async () => {
    characters = new InMemoryCharacterRepository();
    repo = makeRepo();
    catalog = makeCatalog();
    await characters.save(
      new DnD5eCharacter({
        id: 'char-1',
        name: 'Arani',
        ownerUsername: 'owner-1',
        attributes: new Attributes(),
        hp: new HealthPoints(10, 10),
        level: 1,
      }),
    );
  });

  describe('GetInventoryUseCase', () => {
    it('anexa o item do catálogo a cada entrada, no idioma pedido', async () => {
      repo.find.mockResolvedValue({
        containers: [{ id: 'bag', kind: 'backpack', name: null, position: 1, coins: COINS }],
        items: [{ id: 'i1', containerId: 'bag', ref: ROPE, quantity: 2 }],
      });

      const inventory = await new GetInventoryUseCase(characters, repo, catalog).execute(
        'char-1',
        'owner-1',
        'pt',
      );

      expect(catalog.findByKeys).toHaveBeenCalledWith([ROPE], 'pt');
      expect(inventory.items).toEqual([
        { id: 'i1', containerId: 'bag', ref: ROPE, quantity: 2, item: rope },
      ]);
      expect(inventory.containers).toHaveLength(1);
    });

    it('ref que saiu do catálogo vira item null, sem quebrar a lista (Ponto 2)', async () => {
      repo.find.mockResolvedValue({
        containers: [],
        items: [
          { id: 'i1', containerId: 'bag', ref: GONE, quantity: 1 },
          { id: 'i2', containerId: 'bag', ref: ROPE, quantity: 3 },
        ],
      });

      const inventory = await new GetInventoryUseCase(characters, repo, catalog).execute(
        'char-1',
        'owner-1',
      );

      expect(inventory.items.map((i) => [i.ref, i.item])).toEqual([
        [GONE, null],
        [ROPE, rope],
      ]);
    });

    it('quem não é dono recebe not found, sem ler o repositório', async () => {
      await expect(
        new GetInventoryUseCase(characters, repo, catalog).execute('char-1', 'other'),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_NOT_FOUND });
      expect(repo.find).not.toHaveBeenCalled();
    });
  });

  describe('AddInventoryItemUseCase', () => {
    const input = { ref: ROPE, containerId: 'bag', quantity: 2 };

    it('soma pelo repositório e devolve a entrada com o item', async () => {
      repo.addItem.mockResolvedValue({ id: 'i1', containerId: 'bag', ref: ROPE, quantity: 2 });

      const entry = await new AddInventoryItemUseCase(characters, repo, catalog).execute(
        'char-1',
        'owner-1',
        input,
        'pt',
      );

      expect(repo.addItem).toHaveBeenCalledWith('char-1', 'bag', ROPE, 2, undefined);
      expect(entry).toEqual({ id: 'i1', containerId: 'bag', ref: ROPE, quantity: 2, item: rope });
    });

    it('ref fora do catálogo responde ITEM_NOT_FOUND sem gravar', async () => {
      await expect(
        new AddInventoryItemUseCase(characters, repo, catalog).execute('char-1', 'owner-1', {
          ...input,
          ref: GONE,
        }),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ITEM_NOT_FOUND });
      expect(repo.addItem).not.toHaveBeenCalled();
    });

    it('lugar de outro personagem responde CONTAINER_NOT_FOUND', async () => {
      repo.addItem.mockResolvedValue(null);

      await expect(
        new AddInventoryItemUseCase(characters, repo, catalog).execute('char-1', 'owner-1', input),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.CONTAINER_NOT_FOUND });
    });

    it('quem não é dono recebe erro de acesso antes de tocar no repositório (Ponto 5)', async () => {
      await expect(
        new AddInventoryItemUseCase(characters, repo, catalog).execute('char-1', 'gm-1', input),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_FORBIDDEN });
      expect(repo.addItem).not.toHaveBeenCalled();
      expect(catalog.find).not.toHaveBeenCalled();
    });
  });

  describe('SetInventoryItemQuantityUseCase', () => {
    it('grava o valor absoluto', async () => {
      await new SetInventoryItemQuantityUseCase(characters, repo).execute(
        'char-1',
        'owner-1',
        'i1',
        7,
      );
      expect(repo.setQuantity).toHaveBeenCalledWith('char-1', 'i1', 7);
    });

    it('entrada que não é do personagem responde ITEM_NOT_FOUND', async () => {
      repo.setQuantity.mockResolvedValue(false);
      await expect(
        new SetInventoryItemQuantityUseCase(characters, repo).execute('char-1', 'owner-1', 'i1', 7),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ITEM_NOT_FOUND });
    });

    it('quem não é dono recebe erro de acesso (Ponto 5)', async () => {
      await expect(
        new SetInventoryItemQuantityUseCase(characters, repo).execute('char-1', 'gm-1', 'i1', 7),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_FORBIDDEN });
      expect(repo.setQuantity).not.toHaveBeenCalled();
    });
  });

  describe('ChangeInventoryItemQuantityUseCase', () => {
    const change = { delta: -1, key: 'key-1' };

    it('manda a diferença e a chave, e devolve a quantidade nova', async () => {
      const answer = await new ChangeInventoryItemQuantityUseCase(characters, repo).execute(
        'char-1',
        'owner-1',
        'i1',
        change,
      );
      expect(repo.changeQuantity).toHaveBeenCalledWith('char-1', 'i1', -1, 'key-1');
      expect(answer).toEqual({ quantity: 3 });
    });

    it('entrada que não é do personagem responde ITEM_NOT_FOUND', async () => {
      repo.changeQuantity.mockResolvedValue(null);
      await expect(
        new ChangeInventoryItemQuantityUseCase(characters, repo).execute(
          'char-1',
          'owner-1',
          'i1',
          change,
        ),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ITEM_NOT_FOUND });
    });

    it('quem não é dono recebe erro de acesso', async () => {
      await expect(
        new ChangeInventoryItemQuantityUseCase(characters, repo).execute(
          'char-1',
          'gm-1',
          'i1',
          change,
        ),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_FORBIDDEN });
      expect(repo.changeQuantity).not.toHaveBeenCalled();
    });
  });

  describe('RemoveInventoryItemUseCase', () => {
    it('remove a entrada', async () => {
      await new RemoveInventoryItemUseCase(characters, repo).execute('char-1', 'owner-1', 'i1');
      expect(repo.remove).toHaveBeenCalledWith('char-1', 'i1');
    });

    it('entrada que não é do personagem responde ITEM_NOT_FOUND', async () => {
      repo.remove.mockResolvedValue(false);
      await expect(
        new RemoveInventoryItemUseCase(characters, repo).execute('char-1', 'owner-1', 'i1'),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ITEM_NOT_FOUND });
    });

    it('quem não é dono recebe erro de acesso (Ponto 5)', async () => {
      await expect(
        new RemoveInventoryItemUseCase(characters, repo).execute('char-1', 'gm-1', 'i1'),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_FORBIDDEN });
      expect(repo.remove).not.toHaveBeenCalled();
    });
  });

  describe('SetInventoryCoinsUseCase', () => {
    it('grava as moedas do lugar', async () => {
      await new SetInventoryCoinsUseCase(characters, repo).execute(
        'char-1',
        'owner-1',
        'pouch',
        COINS,
      );
      expect(repo.setCoins).toHaveBeenCalledWith('char-1', 'pouch', COINS);
    });

    it('lugar de outro personagem responde CONTAINER_NOT_FOUND', async () => {
      repo.setCoins.mockResolvedValue(false);
      await expect(
        new SetInventoryCoinsUseCase(characters, repo).execute('char-1', 'owner-1', 'pouch', COINS),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.CONTAINER_NOT_FOUND });
    });

    it('quem não é dono recebe erro de acesso (Ponto 5)', async () => {
      await expect(
        new SetInventoryCoinsUseCase(characters, repo).execute('char-1', 'gm-1', 'pouch', COINS),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_FORBIDDEN });
      expect(repo.setCoins).not.toHaveBeenCalled();
    });
  });

  describe('ChangeInventoryCoinsUseCase', () => {
    const change = { delta: { gp: 1 }, key: 'key-1' };

    it('manda a diferença e devolve as moedas de agora', async () => {
      const answer = await new ChangeInventoryCoinsUseCase(characters, repo).execute(
        'char-1',
        'owner-1',
        'pouch',
        change,
      );
      expect(repo.changeCoins).toHaveBeenCalledWith('char-1', 'pouch', { gp: 1 }, 'key-1');
      expect(answer).toEqual({ coins: COINS });
    });

    it('lugar de outro personagem responde CONTAINER_NOT_FOUND', async () => {
      repo.changeCoins.mockResolvedValue(null);
      await expect(
        new ChangeInventoryCoinsUseCase(characters, repo).execute(
          'char-1',
          'owner-1',
          'pouch',
          change,
        ),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.CONTAINER_NOT_FOUND });
    });

    it('quem não é dono recebe erro de acesso', async () => {
      await expect(
        new ChangeInventoryCoinsUseCase(characters, repo).execute(
          'char-1',
          'gm-1',
          'pouch',
          change,
        ),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_FORBIDDEN });
      expect(repo.changeCoins).not.toHaveBeenCalled();
    });

    it('moeda digitada: manda o valor final com o que a pessoa viu, sem somar', async () => {
      const typed = { coins: { gp: 70 }, expected: { gp: 50 }, key: 'key-2' };
      const answer = await new ChangeInventoryCoinsUseCase(characters, repo).execute(
        'char-1',
        'owner-1',
        'pouch',
        typed,
      );
      expect(repo.setCoinsIfUnchanged).toHaveBeenCalledWith(
        'char-1',
        'pouch',
        { gp: 70 },
        { gp: 50 },
        'key-2',
      );
      expect(repo.changeCoins).not.toHaveBeenCalled();
      expect(answer).toEqual({ coins: COINS });
    });
  });

  describe('GetPartyCharacterInventoryUseCase', () => {
    const access = {
      isGmOfCharacter: vi.fn(async (_p: string, _c: string, u: string) => u === 'gm-1'),
    };

    it('o mestre da mesa lê o inventário', async () => {
      await new GetPartyCharacterInventoryUseCase(repo, catalog, access).execute(
        'party-1',
        'char-1',
        'gm-1',
      );
      expect(repo.find).toHaveBeenCalledWith('char-1');
    });

    it('quem não é o mestre recebe not found, sem ler o repositório', async () => {
      await expect(
        new GetPartyCharacterInventoryUseCase(repo, catalog, access).execute(
          'party-1',
          'char-1',
          'other',
        ),
      ).rejects.toMatchObject({ message: CharacterErrorCodes.ACCESS_NOT_FOUND });
      expect(repo.find).not.toHaveBeenCalled();
    });
  });
});

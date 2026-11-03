import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ItemDto } from '@backend/contexts/items/domain/item';

import { CharacterErrorCodes } from '../../domain/CharacterError';
import { InventoryRepo } from '../../domain/repository/inventory.repo';
import {
  AddPartyChestItemUseCase,
  GetPartyChestUseCase,
  RemovePartyChestItemUseCase,
  SetPartyChestCoinsUseCase,
  SetPartyChestItemQuantityUseCase,
} from './party-chest.use-cases';

const PARTY = 'party-1';
const ROPE = 'dnd5e:srd-5.2:item:rope';
const COINS = { cp: 0, sp: 0, ep: 0, gp: 5, pp: 0 };
const CHEST = { id: 'chest', kind: 'party_chest' as const, name: null, position: 0, coins: COINS };

const rope = { key: ROPE, id: 'rope', name: 'Rope' } as ItemDto;

const makeCatalog = () => ({
  find: vi.fn((key: string) => (key === ROPE ? rope : null)),
  findByKeys: vi.fn((keys: string[]) => keys.filter((key) => key === ROPE).map(() => rope)),
});

const makeRepo = () =>
  ({
    find: vi.fn().mockResolvedValue({ containers: [CHEST], items: [] }),
    addItem: vi.fn(),
    setQuantity: vi.fn().mockResolvedValue(true),
    remove: vi.fn().mockResolvedValue(true),
    setCoins: vi.fn().mockResolvedValue(true),
  }) satisfies InventoryRepo;

describe('party chest use cases', () => {
  let repo: ReturnType<typeof makeRepo>;
  let catalog: ReturnType<typeof makeCatalog>;

  beforeEach(() => {
    repo = makeRepo();
    catalog = makeCatalog();
  });

  it('lê o baú com os itens resolvidos no catálogo', async () => {
    repo.find.mockResolvedValue({
      containers: [CHEST],
      items: [{ id: 'e1', containerId: 'chest', ref: ROPE, quantity: 2 }],
    });

    const chest = await new GetPartyChestUseCase(repo, catalog).execute(PARTY, 'pt');

    expect(repo.find).toHaveBeenCalledWith(PARTY);
    expect(chest.containers).toEqual([CHEST]);
    expect(chest.items[0].item).toBe(rope);
  });

  it('quem não é da mesa não vê baú nenhum (o RLS esconde): not found', async () => {
    repo.find.mockResolvedValue({ containers: [], items: [] });

    await expect(new GetPartyChestUseCase(repo, catalog).execute(PARTY)).rejects.toMatchObject({
      code: CharacterErrorCodes.CONTAINER_NOT_FOUND,
    });
  });

  it('adiciona um item do catálogo ao baú', async () => {
    repo.addItem.mockResolvedValue({ id: 'e1', containerId: 'chest', ref: ROPE, quantity: 1 });

    const entry = await new AddPartyChestItemUseCase(repo, catalog).execute(PARTY, {
      ref: ROPE,
      containerId: 'chest',
      quantity: 1,
    });

    expect(repo.addItem).toHaveBeenCalledWith(PARTY, 'chest', ROPE, 1);
    expect(entry.item).toBe(rope);
  });

  it('recusa item fora do catálogo e baú que não é da mesa', async () => {
    const add = new AddPartyChestItemUseCase(repo, catalog);

    await expect(
      add.execute(PARTY, { ref: 'dnd5e:srd-5.2:item:gone', containerId: 'chest', quantity: 1 }),
    ).rejects.toMatchObject({ code: CharacterErrorCodes.ITEM_NOT_FOUND });

    repo.addItem.mockResolvedValue(null);
    await expect(
      add.execute(PARTY, { ref: ROPE, containerId: 'other', quantity: 1 }),
    ).rejects.toMatchObject({ code: CharacterErrorCodes.CONTAINER_NOT_FOUND });
  });

  it('quantidade, remover e moedas respondem not found quando nada mudou', async () => {
    await new SetPartyChestItemQuantityUseCase(repo).execute(PARTY, 'e1', 3);
    await new RemovePartyChestItemUseCase(repo).execute(PARTY, 'e1');
    await new SetPartyChestCoinsUseCase(repo).execute(PARTY, 'chest', COINS);
    expect(repo.setQuantity).toHaveBeenCalledWith(PARTY, 'e1', 3);
    expect(repo.remove).toHaveBeenCalledWith(PARTY, 'e1');
    expect(repo.setCoins).toHaveBeenCalledWith(PARTY, 'chest', COINS);

    repo.setQuantity.mockResolvedValue(false);
    repo.remove.mockResolvedValue(false);
    repo.setCoins.mockResolvedValue(false);
    await expect(
      new SetPartyChestItemQuantityUseCase(repo).execute(PARTY, 'e1', 3),
    ).rejects.toMatchObject({ code: CharacterErrorCodes.ITEM_NOT_FOUND });
    await expect(new RemovePartyChestItemUseCase(repo).execute(PARTY, 'e1')).rejects.toMatchObject({
      code: CharacterErrorCodes.ITEM_NOT_FOUND,
    });
    await expect(
      new SetPartyChestCoinsUseCase(repo).execute(PARTY, 'chest', COINS),
    ).rejects.toMatchObject({ code: CharacterErrorCodes.CONTAINER_NOT_FOUND });
  });
});

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';

import type {
  InventoryDto,
  InventoryItem,
} from '@backend/contexts/characters/domain/repository/inventory.repo';

import type { Coins } from '@shared/systems/dnd5e/coins';

export type { InventoryDto, InventoryItem };

type Rollback = { previous: InventoryDto | undefined };

/**
 * A character's inventory (coin pouch, backpack and the rest), read from the sheet's source (the
 * owner's route, or the GM's read-only one). Every write is optimistic: the cache changes at
 * once, and on failure it goes back and a toast says why.
 */
export function useInventory(characterId: string) {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const { getErrorMessage } = useErrorMessage();
  const { apiPath } = useSheetSource(characterId);
  const key = ['inventory', characterId, locale];

  const query = useQuery<InventoryDto>({
    queryKey: key,
    queryFn: () => rpgWorldApi.get<InventoryDto>(`${apiPath}/inventory?locale=${locale}`),
    enabled: !!characterId,
  });
  const inventory = query.data;

  const pouch = inventory?.containers.find((c) => c.kind === 'coin_pouch');
  const backpack = inventory?.containers.find((c) => c.kind === 'backpack');

  /** Applies `change` to the cached inventory, at once, and remembers what was there. */
  const optimistic = (change: (current: InventoryDto) => InventoryDto): Rollback => {
    void queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<InventoryDto>(key);
    if (previous) queryClient.setQueryData<InventoryDto>(key, change(previous));
    return { previous };
  };
  const rollback = (err: unknown, _vars: unknown, context: Rollback | undefined) => {
    if (context?.previous) queryClient.setQueryData(key, context.previous);
    toast.error(getErrorMessage(err));
  };
  /** Puts an entry the server answered with in the cache (replacing the one with the same id). */
  const upsert = (entry: InventoryItem) =>
    queryClient.setQueryData<InventoryDto>(key, (current) =>
      current
        ? {
            ...current,
            items: current.items.some((i) => i.id === entry.id)
              ? current.items.map((i) => (i.id === entry.id ? entry : i))
              : [...current.items, entry],
          }
        : current,
    );

  // Every write shares one scope, so TanStack Query sends them one at a time, in the order they
  // were made: absolute values (quantity n, the coins) and an undo (POST after DELETE) can't land
  // out of order. The optimistic change still shows at once (onMutate runs before the queue).
  // Once the last write in flight settles, resync with the server: a failed write rolls the cache
  // back to a snapshot that may predate a newer optimistic value, and a refetch while another
  // write is pending would overwrite that newer value.
  const mutationKey = ['inventory-write', characterId, locale];
  const settle = {
    mutationKey,
    scope: { id: `inventory-${characterId}` },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  };

  const add = useMutation({
    ...settle,
    mutationFn: (v: { ref: string; containerId: string; quantity: number }) =>
      rpgWorldApi.post<InventoryItem>(`${apiPath}/inventory/items?locale=${locale}`, v),
    onSuccess: upsert,
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const quantity = useMutation({
    ...settle,
    mutationFn: (v: { itemId: string; quantity: number }) =>
      rpgWorldApi.patch(`${apiPath}/inventory/items/${v.itemId}`, { quantity: v.quantity }),
    onMutate: (v) =>
      optimistic((c) => ({
        ...c,
        items: c.items.map((i) => (i.id === v.itemId ? { ...i, quantity: v.quantity } : i)),
      })),
    onError: rollback,
  });

  const remove = useMutation({
    ...settle,
    mutationFn: (itemId: string) => rpgWorldApi.delete(`${apiPath}/inventory/items/${itemId}`),
    onMutate: (itemId) =>
      optimistic((c) => ({ ...c, items: c.items.filter((i) => i.id !== itemId) })),
    onError: rollback,
  });

  const coins = useMutation({
    ...settle,
    mutationFn: (v: { containerId: string; coins: Coins }) =>
      rpgWorldApi.put(`${apiPath}/inventory/coins`, v),
    onMutate: (v) =>
      optimistic((c) => ({
        ...c,
        containers: c.containers.map((k) =>
          k.id === v.containerId ? { ...k, coins: v.coins } : k,
        ),
      })),
    onError: rollback,
  });

  return {
    inventory,
    isLoading: query.isLoading,
    pouch,
    backpack,
    /** Adds to the backpack (or `containerId`); an item already there has its quantity summed. */
    addItem: (
      ref: string,
      {
        quantity: n = 1,
        containerId = backpack?.id,
      }: { quantity?: number; containerId?: string } = {},
    ) => {
      if (containerId) add.mutate({ ref, containerId, quantity: n });
    },
    /** Sets the absolute quantity. */
    setQuantity: (itemId: string, n: number) => quantity.mutate({ itemId, quantity: n }),
    removeItem: (itemId: string) => remove.mutate(itemId),
    /** Puts back an entry that was removed (for an "undo"): same ref, quantity and container. */
    restoreItem: (item: Pick<InventoryItem, 'ref' | 'quantity' | 'containerId'>) =>
      add.mutate({ ref: item.ref, containerId: item.containerId, quantity: item.quantity }),
    /** Replaces the coins of the coin pouch. */
    setCoins: (next: Coins) => {
      if (pouch) coins.mutate({ containerId: pouch.id, coins: next });
    },
  };
}

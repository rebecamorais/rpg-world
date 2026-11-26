import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocale, useTranslations } from 'next-intl';
import { toast } from 'sonner';

import { rpgWorldApi } from '@client';

import { isDemoReadOnly } from '@frontend/demo/transport';
import { useErrorMessage } from '@frontend/hooks/useErrorMessage';
import { useSheetSource } from '@frontend/hooks/useSheetSource';
import { isRetryable, statusOf } from '@frontend/lib/error-message';

import type {
  InventoryDto,
  InventoryItem,
} from '@backend/contexts/characters/domain/repository/inventory.repo';

import { COINS, type Coin, type Coins } from '@shared/systems/dnd5e/coins';

export type { InventoryItem };

type CoinsDelta = Partial<Coins>;

type AddVars = { ref: string; containerId: string; quantity: number; key: string };
type QuantityVars = { itemId: string; delta: number; key: string };
type CoinsVars = { containerId: string; delta: CoinsDelta; key: string };
/** A coin typed by hand: its final `value`, and what the screen showed (`seen`) when typing began. */
type TypedCoinVars = { containerId: string; coin: Coin; value: number; seen: number; key: string };
/** The entry a DELETE took out of the cache, and where it was, to put back if it fails. */
type Removed = { entry: InventoryItem; index: number } | undefined;

/** What changes from `from` to `to`, only the coins that do. */
export function coinsDelta(from: Coins, to: Coins): CoinsDelta {
  return Object.fromEntries(
    COINS.filter((coin) => to[coin] !== from[coin]).map((coin) => [coin, to[coin] - from[coin]]),
  );
}

/** `coins` plus `delta` (times `sign`: -1 takes it back out). */
const addCoins = (coins: Coins, delta: CoinsDelta, sign = 1): Coins =>
  Object.fromEntries(COINS.map((coin) => [coin, coins[coin] + sign * (delta[coin] ?? 0)])) as Coins;

/**
 * A character's inventory (coin pouch, backpack and the rest), read from the sheet's source (the
 * owner's route, or the GM's read-only one).
 */
export function useInventory(characterId: string) {
  const { apiPath } = useSheetSource(characterId);
  return useInventoryAt(`${apiPath}/inventory`, characterId);
}

/** The party chest: one container that holds both the coins and the items. */
export function usePartyChest(partyId: string) {
  // Shared: coming back to the tab shows what the others did meanwhile
  return useInventoryAt(`/api/parties/${partyId}/chest`, `party-${partyId}`, { shared: true });
}

export type InventoryApi = ReturnType<typeof useInventoryAt>;

/**
 * The containers and entries behind `path` (a character's inventory or a party chest). Every write
 * is optimistic: the cache changes at once, and on failure it goes back and a toast says why.
 *
 * Coins and quantities go to the server as operations (+1 PO, -1 rope), not as the final value,
 * so two tabs (or the GM and a player on the chest) add up instead of undoing each other. Each
 * carries an idempotency key: the same request sent again is applied once.
 *
 * A coin typed by hand is the exception: it goes as the final value, with the value the screen
 * showed, and the server refuses it (409) when someone changed that coin meanwhile.
 *
 * A failed write undoes only its own change and shows a toast. Only when the same request can
 * work later (no connection, a server failure) does it offer "Try again", which sends the very
 * same operation again (same variables, so the same key): when the first try did reach the server
 * and only the answer was lost, the retry is not applied twice. A conflict or an entry that is
 * gone would fail the same way: the toast says what changed and the refetch shows it.
 */
function useInventoryAt(path: string, ownerKey: string, { shared = false } = {}) {
  const queryClient = useQueryClient();
  const locale = useLocale();
  const { getErrorMessage } = useErrorMessage();
  const t = useTranslations('common');
  const tCoins = useTranslations('characters.coins');
  const tInventory = useTranslations('characters.inventory');
  const key = ['inventory', ownerKey, locale];
  const mutationKey = ['inventory-write', ownerKey, locale];

  const query = useQuery<InventoryDto>({
    queryKey: key,
    queryFn: () => rpgWorldApi.get<InventoryDto>(`${path}?locale=${locale}`),
    enabled: !!ownerKey,
    // Not while a write is on its way: the refetch would undo its optimistic value on screen
    refetchOnWindowFocus: () => shared && queryClient.isMutating({ mutationKey }) === 0,
  });
  const inventory = query.data;

  // The party chest holds the party's coins and its items
  const pouch = inventory?.containers.find(
    (c) => c.kind === 'coin_pouch' || c.kind === 'party_chest',
  );
  const backpack = inventory?.containers.find(
    (c) => c.kind === 'backpack' || c.kind === 'party_chest',
  );

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
  // were made: an undo (POST after DELETE) can't land before what it undoes, nor a change on an
  // entry before the POST that brought it back. The optimistic change still shows at once
  // (onMutate runs before the queue). Once the last write in flight settles, resync with the
  // server: it also has what other tabs did, and a refetch while another write is pending would
  // overwrite that write's optimistic value.
  const settle = {
    mutationKey,
    scope: { id: `inventory-${ownerKey}` },
    onSettled: () => {
      if (queryClient.isMutating({ mutationKey }) === 1) {
        void queryClient.invalidateQueries({ queryKey: key });
      }
    },
  };

  /** Puts a removed entry back at its place, unless it is there again (an undo that landed). */
  const restoreEntry = ({ entry, index }: { entry: InventoryItem; index: number }) =>
    queryClient.setQueryData<InventoryDto>(key, (c) => {
      if (!c || c.items.some((i) => i.id === entry.id)) return c;
      const items = [...c.items];
      items.splice(Math.min(index, items.length), 0, entry);
      return { ...c, items };
    });
  /** Adds `delta` to an entry's quantity in the cache (a negative one takes it back). */
  const shiftQuantity = (itemId: string, delta: number) =>
    queryClient.setQueryData<InventoryDto>(key, (c) =>
      c
        ? {
            ...c,
            items: c.items.map((i) =>
              i.id === itemId ? { ...i, quantity: i.quantity + delta } : i,
            ),
          }
        : c,
    );
  /** Adds `delta` to a container's coins in the cache (`sign` -1 takes it back). */
  const shiftCoins = (containerId: string, delta: CoinsDelta, sign = 1) =>
    queryClient.setQueryData<InventoryDto>(key, (c) =>
      c
        ? {
            ...c,
            containers: c.containers.map((k) =>
              k.id === containerId ? { ...k, coins: addCoins(k.coins, delta, sign) } : k,
            ),
          }
        : c,
    );
  /**
   * Undoes only this operation (other writes still on their way keep their optimistic value) and
   * says why. "Try again" (`retry`: the same mutation with the same variables, key included, so
   * the server applies it at most once even if the failed try did land) only where it can work.
   */
  const failed = (err: unknown, undo: () => void, retry: () => void, message?: string) => {
    undo();
    // The demo already answered with its invite (or its own toast): a second one would stack
    if (isDemoReadOnly(err)) return;
    toast.error(message ?? getErrorMessage(err), {
      action: isRetryable(err) ? { label: t('retry'), onClick: retry } : undefined,
    });
  };
  /** A 404 on an entry: someone took it out (another tab, or someone else on the chest). */
  const goneMessage = (err: unknown) =>
    statusOf(err) === 404 ? tInventory('itemGone') : undefined;
  /** The 409 of a typed coin carries the coins now: "Changed somewhere else: it's now 55 GP". */
  const typedCoinMessage = (err: unknown, coin: Coin) => {
    const now = (err as { data?: { coins?: Partial<Coins> } } | undefined)?.data?.coins?.[coin];
    if (statusOf(err) !== 409 || typeof now !== 'number') return undefined;
    // Count and coin apart: the ICU plural agrees with the count ("agora é 1 PO", "agora são 55 PO")
    return tCoins('changedElsewhere', { count: now, coin: tCoins(`${coin}.short`) });
  };

  // The callbacks name their return type: they call their own mutation (the retry), and an
  // inferred one would make its type depend on itself
  const add = useMutation({
    ...settle,
    mutationFn: (v: AddVars) =>
      rpgWorldApi.post<InventoryItem>(`${path}/items?locale=${locale}`, v),
    onSuccess: upsert,
    onError: (err, v): void =>
      failed(
        err,
        () => {},
        () => add.mutate(v),
      ),
  });

  const quantity = useMutation({
    ...settle,
    mutationFn: (v: QuantityVars) =>
      rpgWorldApi.patch(`${path}/items/${v.itemId}`, { delta: v.delta, key: v.key }),
    onMutate: (v) => {
      void queryClient.cancelQueries({ queryKey: key });
      shiftQuantity(v.itemId, v.delta);
    },
    onError: (err, v): void =>
      failed(
        err,
        () => shiftQuantity(v.itemId, -v.delta),
        () => quantity.mutate(v),
        goneMessage(err),
      ),
  });

  const remove = useMutation({
    ...settle,
    mutationFn: (itemId: string) => rpgWorldApi.delete(`${path}/items/${itemId}`),
    onMutate: (itemId): Removed => {
      void queryClient.cancelQueries({ queryKey: key });
      const items = queryClient.getQueryData<InventoryDto>(key)?.items ?? [];
      const index = items.findIndex((i) => i.id === itemId);
      if (index === -1) return undefined;
      queryClient.setQueryData<InventoryDto>(key, (c) =>
        c ? { ...c, items: c.items.filter((i) => i.id !== itemId) } : c,
      );
      return { entry: items[index], index };
    },
    // Puts back only the entry this DELETE took out, where it was: a snapshot of the whole list
    // would also undo the other writes made while this one was on its way
    onError: (err, itemId, removed): void =>
      failed(
        err,
        () => removed && restoreEntry(removed),
        () => remove.mutate(itemId),
        goneMessage(err),
      ),
  });

  const coins = useMutation({
    ...settle,
    mutationFn: (v: CoinsVars) => rpgWorldApi.patch(`${path}/coins`, v),
    onMutate: (v) => {
      void queryClient.cancelQueries({ queryKey: key });
      shiftCoins(v.containerId, v.delta);
    },
    onError: (err, v): void =>
      failed(
        err,
        () => shiftCoins(v.containerId, v.delta, -1),
        () => coins.mutate(v),
      ),
  });

  /** What the cache shows now (with the writes still on their way), not what the last render saw. */
  const cached = () => queryClient.getQueryData<InventoryDto>(key);

  /** Puts `value` as `coin` of a container in the cache, if it still shows `from` there. */
  const putCoin = (containerId: string, coin: Coin, from: number, value: number) =>
    queryClient.setQueryData<InventoryDto>(key, (c) =>
      c
        ? {
            ...c,
            containers: c.containers.map((k) =>
              k.id === containerId && k.coins[coin] === from
                ? { ...k, coins: { ...k.coins, [coin]: value } }
                : k,
            ),
          }
        : c,
    );

  const typedCoin = useMutation({
    ...settle,
    mutationFn: ({ containerId, coin, value, seen, key: opKey }: TypedCoinVars) =>
      rpgWorldApi.patch(`${path}/coins`, {
        containerId,
        coins: { [coin]: value },
        expected: { [coin]: seen },
        key: opKey,
      }),
    // Shows the typed value at once, and remembers what the cache had to put it back on failure
    onMutate: (v): number | undefined => {
      void queryClient.cancelQueries({ queryKey: key });
      const before = cached()?.containers.find((c) => c.id === v.containerId)?.coins[v.coin];
      if (before !== undefined) putCoin(v.containerId, v.coin, before, v.value);
      return before;
    },
    onError: (err, v, before): void =>
      failed(
        err,
        () => before !== undefined && putCoin(v.containerId, v.coin, v.value, before),
        () => typedCoin.mutate(v),
        typedCoinMessage(err, v.coin),
      ),
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
      if (!containerId) return;
      // The dialog closes at once, so the toast is the only sign the item went in; the count it
      // shows makes a second add on a slow network visible. One id: the next add replaces it.
      // Not on restoreItem: an undo already has its own toast
      add.mutate(
        { ref, containerId, quantity: n, key: crypto.randomUUID() },
        {
          onSuccess: (entry) =>
            toast(
              tInventory('added', {
                name: entry.item?.name ?? entry.ref,
                quantity: entry.quantity,
              }),
              { id: `inventory-added-${ownerKey}` },
            ),
        },
      );
    },
    /** Shows `n` at once; the server gets the difference from what is shown now. */
    setQuantity: (itemId: string, n: number) => {
      const current = cached()?.items.find((i) => i.id === itemId);
      if (!current || current.quantity === n) return;
      quantity.mutate({ itemId, delta: n - current.quantity, key: crypto.randomUUID() });
    },
    removeItem: (itemId: string) => remove.mutate(itemId),
    /** Puts back an entry that was removed (for an "undo"): same ref, quantity and container. */
    restoreItem: (item: Pick<InventoryItem, 'ref' | 'quantity' | 'containerId'>) =>
      add.mutate({
        ref: item.ref,
        containerId: item.containerId,
        quantity: item.quantity,
        key: crypto.randomUUID(),
      }),
    /**
     * Shows `next` in the coin pouch at once; the server gets the difference, coin by coin. For
     * Pay and Receive: two people paying at once both count.
     */
    setCoins: (next: Coins) => {
      const current = cached()?.containers.find((c) => c.id === pouch?.id);
      if (!current) return;
      const delta = coinsDelta(current.coins, next);
      if (Object.keys(delta).length === 0) return;
      coins.mutate({ containerId: current.id, delta, key: crypto.randomUUID() });
    },
    /**
     * A coin typed by hand: `value` is the final count, written only if the server still has
     * `seen` (what the field showed when the person began typing). If someone changed it
     * meanwhile, nothing is written and a toast says what it is now.
     */
    setCoinTo: (coin: Coin, value: number, seen: number) => {
      if (!pouch || value === seen) return;
      typedCoin.mutate({ containerId: pouch.id, coin, value, seen, key: crypto.randomUUID() });
    },
  };
}

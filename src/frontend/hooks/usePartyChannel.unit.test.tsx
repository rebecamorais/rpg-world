import { useMutation, useQuery } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import { usePartyChest } from '@frontend/hooks/useInventory';
import {
  PARTIES_QUERY_KEY,
  encounterQueryKey,
  partyChestQueryKey,
  partyQueryKey,
} from '@frontend/lib/query-keys';

import { usePartyChannel } from './usePartyChannel';

type StatusCallback = (status: string) => void;
type BroadcastCallback = () => void;

// A stand-in for the Supabase channel: the test drives subscribe statuses and broadcasts
const fake = vi.hoisted(() => {
  const state = {
    status: undefined as StatusCallback | undefined,
    broadcasts: {} as Record<string, BroadcastCallback>,
    topic: '',
    options: undefined as unknown,
  };
  const channel = {
    on: vi.fn((_type: string, filter: { event: string }, callback: BroadcastCallback) => {
      state.broadcasts[filter.event] = callback;
      return channel;
    }),
    subscribe: vi.fn((callback: StatusCallback) => {
      state.status = callback;
      return channel;
    }),
  };
  const client = {
    realtime: { setAuth: vi.fn().mockResolvedValue(undefined) },
    channel: vi.fn((topic: string, options: unknown) => {
      state.topic = topic;
      state.options = options;
      return channel;
    }),
    removeChannel: vi.fn(),
  };
  return { state, channel, client };
});

const demo = vi.hoisted(() => ({ isDemo: false }));
vi.mock('@lib/supabase-browser', () => ({ getSupabaseBrowserClient: () => fake.client }));
vi.mock('@frontend/demo/DemoContext', () => ({ useDemo: () => demo }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn() },
}));

const broadcast = (event: string) => fake.state.broadcasts[event]!();

describe('usePartyChannel', () => {
  beforeEach(() => {
    demo.isDemo = false;
    fake.client.removeChannel.mockClear();
    fake.client.realtime.setAuth.mockClear();
    fake.state.status = undefined;
    fake.state.broadcasts = {};
  });

  const subscribed = async () => {
    await waitFor(() => expect(fake.state.status).toBeDefined());
  };

  it('assina o tópico privado da mesa e busca de novo a cada SUBSCRIBED e a cada aviso', async () => {
    const { result, queryClient } = renderHookWithProviders(() => usePartyChannel('party-1'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await subscribed();

    expect(fake.state.topic).toBe('party:party-1');
    expect(fake.state.options).toEqual({ config: { private: true } });
    expect(fake.client.realtime.setAuth).toHaveBeenCalled();
    expect(result.current.live).toBe(false);

    await act(async () => fake.state.status!('SUBSCRIBED'));
    expect(result.current.live).toBe(true);
    expect(invalidate).toHaveBeenCalledWith({ queryKey: encounterQueryKey('party-1') });

    invalidate.mockClear();
    await act(async () => broadcast('encounter'));
    expect(invalidate).toHaveBeenCalledWith({ queryKey: encounterQueryKey('party-1') });
  });

  it('ouve os avisos da mesa e do baú além do combate', async () => {
    renderHookWithProviders(() => usePartyChannel('party-1'));
    await subscribed();

    expect(Object.keys(fake.state.broadcasts).sort()).toEqual(['chest', 'encounter', 'party']);
  });

  // Who is at the table and what they brought: the party tab and the party list (pending requests)
  it('o aviso "party" busca de novo a mesa e a lista de mesas, não o combate', async () => {
    const { queryClient } = renderHookWithProviders(() => usePartyChannel('party-1'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await subscribed();

    await act(async () => broadcast('party'));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: partyQueryKey('party-1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: PARTIES_QUERY_KEY });
    expect(invalidate).not.toHaveBeenCalledWith({ queryKey: encounterQueryKey('party-1') });
  });

  it('cada SUBSCRIBED busca de novo a mesa e o baú também', async () => {
    const { queryClient } = renderHookWithProviders(() => usePartyChannel('party-1'));
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await subscribed();

    await act(async () => fake.state.status!('SUBSCRIBED'));

    expect(invalidate).toHaveBeenCalledWith({ queryKey: partyQueryKey('party-1') });
    expect(invalidate).toHaveBeenCalledWith({ queryKey: partyChestQueryKey('party-1') });
  });

  // The real chest hook, so a change to its keys can't silently stop the channel from reaching it
  describe('baú', () => {
    const chest = { containers: [], items: [] };

    it('o aviso "chest" busca de novo o baú aberto', async () => {
      vi.mocked(rpgWorldApi.get).mockResolvedValue(chest);
      renderHookWithProviders(() => {
        usePartyChest('party-1');
        return usePartyChannel('party-1');
      });
      await subscribed();
      await waitFor(() => expect(rpgWorldApi.get).toHaveBeenCalledTimes(1));

      await act(async () => broadcast('chest'));

      await waitFor(() => expect(rpgWorldApi.get).toHaveBeenCalledTimes(2));
      expect(vi.mocked(rpgWorldApi.get).mock.calls[1][0]).toMatch('/api/parties/party-1/chest');
    });

    // The person's own coin change still on its way: it refetches when it lands
    it('com uma escrita do baú a caminho, o aviso espera por ela', async () => {
      vi.mocked(rpgWorldApi.get).mockResolvedValue(chest);
      const { result, queryClient } = renderHookWithProviders(() => {
        const write = useMutation({
          mutationKey: ['inventory-write', 'party-party-1', 'en'],
          mutationFn: () => new Promise(() => {}),
        });
        usePartyChannel('party-1');
        return write;
      });
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
      await subscribed();

      act(() => result.current.mutate());
      await waitFor(() => expect(result.current.isPending).toBe(true));
      await act(async () => broadcast('chest'));

      expect(invalidate).not.toHaveBeenCalled();
    });
  });

  it('live fica falso quando a conexão cai, e volta ao reassinar', async () => {
    const { result } = renderHookWithProviders(() => usePartyChannel('party-1'));
    await subscribed();

    await act(async () => fake.state.status!('SUBSCRIBED'));
    await act(async () => fake.state.status!('CHANNEL_ERROR'));
    expect(result.current.live).toBe(false);

    await act(async () => fake.state.status!('SUBSCRIBED'));
    expect(result.current.live).toBe(true);
  });

  it('remove o canal ao desmontar', async () => {
    const { unmount } = renderHookWithProviders(() => usePartyChannel('party-1'));
    await subscribed();

    unmount();

    expect(fake.client.removeChannel).toHaveBeenCalledWith(fake.channel);
  });

  // The first load can still be in flight when the channel subscribes (or a change arrives):
  // reusing that request would keep what it read before the change
  it('um aviso durante a primeira busca busca de novo, em vez de aproveitar a busca antiga', async () => {
    const queryFn = vi.fn(() => new Promise<string>(() => {}));
    renderHookWithProviders(() => {
      useQuery({ queryKey: encounterQueryKey('party-1'), queryFn });
      return usePartyChannel('party-1');
    });
    await subscribed();
    expect(queryFn).toHaveBeenCalledTimes(1);

    await act(async () => fake.state.status!('SUBSCRIBED'));

    await waitFor(() => expect(queryFn).toHaveBeenCalledTimes(2));
  });

  it('na demo, não abre canal e não está ao vivo', () => {
    demo.isDemo = true;
    const getClient = vi.spyOn(fake.client, 'channel');

    const { result } = renderHookWithProviders(() => usePartyChannel('p1'));

    expect(getClient).not.toHaveBeenCalled();
    expect(fake.client.realtime.setAuth).not.toHaveBeenCalled();
    expect(result.current.live).toBe(false);
  });

  // The GM's own change still on its way: refetching now would read the database before it is
  // saved and undo it on screen; the change refetches when it finishes, bringing this one too
  it('um aviso com uma mudança do combate a caminho espera por ela, em vez de buscar já', async () => {
    const { result, queryClient } = renderHookWithProviders(() => {
      const change = useMutation({
        mutationKey: encounterQueryKey('party-1'),
        mutationFn: () => new Promise(() => {}),
      });
      usePartyChannel('party-1');
      return change;
    });
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');
    await subscribed();

    act(() => result.current.mutate());
    await waitFor(() => expect(result.current.isPending).toBe(true));
    await act(async () => broadcast('encounter'));

    expect(invalidate).not.toHaveBeenCalled();
  });

  describe('sem conexão', () => {
    const setOnline = (online: boolean) => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(online);
      window.dispatchEvent(new Event(online ? 'online' : 'offline'));
    };

    it('live fica falso offline mesmo com o canal ainda assinado, e busca de novo ao voltar', async () => {
      const { result, queryClient } = renderHookWithProviders(() => usePartyChannel('party-1'));
      await subscribed();
      await act(async () => fake.state.status!('SUBSCRIBED'));
      expect(result.current.live).toBe(true);
      const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

      act(() => setOnline(false));
      expect(result.current.live).toBe(false);
      expect(invalidate).not.toHaveBeenCalled();

      act(() => setOnline(true));
      expect(result.current.live).toBe(true);
      expect(invalidate).toHaveBeenCalledWith({ queryKey: encounterQueryKey('party-1') });
      vi.restoreAllMocks();
    });
  });
});

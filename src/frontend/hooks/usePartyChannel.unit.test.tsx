import { useQuery } from '@tanstack/react-query';
import { act, waitFor } from '@testing-library/react';
import { renderHookWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encounterQueryKey } from '@frontend/lib/query-keys';

import { usePartyChannel } from './usePartyChannel';

type StatusCallback = (status: string) => void;
type BroadcastCallback = () => void;

// A stand-in for the Supabase channel: the test drives subscribe statuses and broadcasts
const fake = vi.hoisted(() => {
  const state = {
    status: undefined as StatusCallback | undefined,
    broadcast: undefined as BroadcastCallback | undefined,
    topic: '',
    options: undefined as unknown,
  };
  const channel = {
    on: vi.fn((_type: string, _filter: unknown, callback: BroadcastCallback) => {
      state.broadcast = callback;
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

describe('usePartyChannel', () => {
  beforeEach(() => {
    demo.isDemo = false;
    fake.client.removeChannel.mockClear();
    fake.client.realtime.setAuth.mockClear();
    fake.state.status = undefined;
    fake.state.broadcast = undefined;
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
    await act(async () => fake.state.broadcast!());
    expect(invalidate).toHaveBeenCalledWith({ queryKey: encounterQueryKey('party-1') });
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
});

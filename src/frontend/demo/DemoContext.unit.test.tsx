import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { act, renderHook, screen, waitFor } from '@testing-library/react';
import {
  messages,
  renderWithProviders as render,
  renderHookWithProviders,
} from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@frontend/lib/api-client/rpg-world-api';

import { DemoProvider, useDemo, useWriteGuard } from './DemoContext';
import type { DemoData } from './types';

const data = { parties: { asGm: [{ id: 'the-pioneers' }] } } as unknown as DemoData;

function Probe() {
  const { isDemo } = useDemo();
  return <p>{isDemo ? 'demo' : 'real'}</p>;
}

vi.mock('sonner', () => ({ toast: Object.assign(vi.fn(), { error: vi.fn() }) }));

afterEach(() => vi.unstubAllGlobals());
beforeEach(() => vi.clearAllMocks());

/** The demo's state, as a component inside the provider sees it. */
const renderDemo = () =>
  renderHookWithProviders(() => useDemo(), {
    wrapper: ({ children }) => <DemoProvider data={data}>{children}</DemoProvider>,
  }).result;

describe('DemoProvider', () => {
  it('answers the API from the catalog while mounted and hits the network after', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response('{}', { status: 200 }));
    vi.stubGlobal('fetch', fetchMock);

    const { unmount } = render(
      <DemoProvider data={data}>
        <Probe />
      </DemoProvider>,
    );
    expect(screen.getByText('demo')).toBeInTheDocument();
    await expect(rpgWorldApi.get('/api/parties')).resolves.toEqual(data.parties);
    expect(fetchMock).not.toHaveBeenCalled();

    unmount();
    await rpgWorldApi.get('/api/parties');
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
  });

  it('has its own QueryClient', () => {
    const outer = new QueryClient();
    const clients: QueryClient[] = [];
    function Grab() {
      clients.push(useQueryClient());
      return null;
    }
    render(
      <QueryClientProvider client={outer}>
        <DemoProvider data={data}>
          <Grab />
        </DemoProvider>
      </QueryClientProvider>,
    );
    expect(clients[0]).not.toBe(outer);
  });

  it('invites on the first refused write, then only one toast, never with the invite open', async () => {
    const demo = renderDemo();

    // A write goes through the transport, like the hooks' writes
    await expect(rpgWorldApi.post('/api/x', {})).rejects.toMatchObject({ status: 403 });
    await waitFor(() => expect(demo.current.inviteOpen).toBe(true));
    act(() => demo.current.refuseWrite());
    expect(toast).not.toHaveBeenCalled();

    act(() => demo.current.setInviteOpen(false));
    act(() => demo.current.refuseWrite());
    act(() => demo.current.refuseWrite());
    expect(demo.current.inviteOpen).toBe(false);
    // Same id both times: Sonner replaces the toast instead of stacking a second one
    expect(toast).toHaveBeenCalledTimes(2);
    expect(vi.mocked(toast).mock.calls[0]).toEqual([
      messages.demo.readOnly,
      { id: 'demo-read-only' },
    ]);
    expect(vi.mocked(toast).mock.calls[1]).toEqual(vi.mocked(toast).mock.calls[0]);
  });

  it('useWriteGuard refuses in the demo instead of opening the form', () => {
    const open = vi.fn();
    function Button() {
      const guard = useWriteGuard();
      return <button onClick={guard(open)}>pay</button>;
    }
    render(
      <DemoProvider data={data}>
        <Button />
      </DemoProvider>,
    );
    act(() => screen.getByRole('button').click());
    expect(open).not.toHaveBeenCalled();

    const outside = renderHook(() => useWriteGuard());
    outside.result.current(open)();
    expect(open).toHaveBeenCalledTimes(1);
  });

  it('is not a demo outside the provider', () => {
    const { result } = renderHook(() => useDemo());
    expect(result.current.isDemo).toBe(false);
    expect(result.current.data).toBeNull();
  });
});

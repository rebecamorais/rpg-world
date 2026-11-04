import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { render, renderHook, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@frontend/lib/api-client/rpgWorldApi';

import { DemoProvider, useDemo } from './DemoContext';
import type { DemoData } from './types';

const data = { parties: { asGm: [{ id: 'the-pioneers' }] } } as unknown as DemoData;

function Probe() {
  const { isDemo } = useDemo();
  return <p>{isDemo ? 'demo' : 'real'}</p>;
}

afterEach(() => vi.unstubAllGlobals());

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

  it('is not a demo outside the provider', () => {
    const { result } = renderHook(() => useDemo());
    expect(result.current.isDemo).toBe(false);
    expect(result.current.data).toBeNull();
  });
});

import { useQuery } from '@tanstack/react-query';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SeededQuery } from './SeededQuery';

function Name({ queryFn }: { queryFn: () => Promise<string> }) {
  const { data } = useQuery({ queryKey: ['name'], queryFn, staleTime: 60_000 });
  return <p>{data ?? 'loading'}</p>;
}

describe('SeededQuery', () => {
  it('o hook começa com o dado do servidor, sem buscar', () => {
    const queryFn = vi.fn(async () => 'from the API');

    renderWithProviders(
      <SeededQuery queryKey={['name']} data="from the server">
        <Name queryFn={queryFn} />
      </SeededQuery>,
    );

    expect(screen.getByText('from the server')).toBeInTheDocument();
    expect(queryFn).not.toHaveBeenCalled();
  });

  it('sem dado do servidor, o hook busca como sempre', async () => {
    const queryFn = vi.fn(async () => 'from the API');

    renderWithProviders(
      <SeededQuery queryKey={['name']} data={null}>
        <Name queryFn={queryFn} />
      </SeededQuery>,
    );

    expect(await screen.findByText('from the API')).toBeInTheDocument();
  });
});

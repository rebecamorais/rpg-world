import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { UsePips } from './UsePips';

const available = (n: number) => screen.getByRole('button', { name: `Ki ${n}, available` });
const spent = (n: number) => screen.getByRole('button', { name: `Ki ${n}, spent` });

describe('UsePips', () => {
  it('toca num quadrado disponível para gastar e num gasto para devolver', async () => {
    const onChange = vi.fn();
    renderWithProviders(<UsePips label="Ki" max={3} used={1} onChange={onChange} />);

    expect(screen.getAllByRole('button')).toHaveLength(3);
    expect(screen.getByRole('group', { name: 'Ki, 2 of 3 available' })).toBeInTheDocument();

    await userEvent.click(available(1));
    expect(onChange).toHaveBeenLastCalledWith(2);

    await userEvent.click(spent(3));
    expect(onChange).toHaveBeenLastCalledWith(0);
  });

  it('sem limite mostra o texto e nenhum botão', () => {
    renderWithProviders(<UsePips label="Ki" max={null} used={0} onChange={vi.fn()} />);

    expect(screen.getByText('unlimited')).toBeInTheDocument();
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('asNumber mostra disponíveis / máximo e os botões - e +', async () => {
    const onChange = vi.fn();
    renderWithProviders(<UsePips label="Ki" max={25} used={5} asNumber onChange={onChange} />);

    expect(screen.getByText('20 / 25')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Spend one use of Ki' }));
    expect(onChange).toHaveBeenLastCalledWith(6);
    await userEvent.click(screen.getByRole('button', { name: 'Return one use of Ki' }));
    expect(onChange).toHaveBeenLastCalledWith(4);
  });

  it('+ fica desabilitado sem nada gasto e - sem nada disponível', () => {
    const { unmount } = renderWithProviders(
      <UsePips label="Ki" max={25} used={0} asNumber onChange={vi.fn()} />,
    );
    expect(screen.getByRole('button', { name: 'Return one use of Ki' })).toBeDisabled();
    unmount();

    renderWithProviders(<UsePips label="Ki" max={25} used={25} asNumber onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: 'Spend one use of Ki' })).toBeDisabled();
  });

  it('máximo acima de 20 usa a forma de número', () => {
    renderWithProviders(<UsePips label="Ki" max={30} used={0} onChange={vi.fn()} />);

    expect(screen.getByText('30 / 30')).toBeInTheDocument();
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });

  it('disabled desabilita todos os botões', () => {
    renderWithProviders(<UsePips label="Ki" max={3} used={1} disabled onChange={vi.fn()} />);

    for (const b of screen.getAllByRole('button')) expect(b).toBeDisabled();
  });

  it('não trava enquanto salva: os toques seguem um atrás do outro', async () => {
    const onChange = vi.fn(() => new Promise<void>(() => {}));
    renderWithProviders(<UsePips label="Ki" max={3} used={0} onChange={onChange} />);

    await userEvent.click(available(1));
    for (const b of screen.getAllByRole('button')) expect(b).toBeEnabled();
    await userEvent.click(available(2));
    expect(onChange).toHaveBeenCalledTimes(2);
  });

  it('um onChange que rejeita não quebra o controle', async () => {
    const onChange = vi.fn(() => Promise.reject(new Error('falhou')));
    renderWithProviders(<UsePips label="Ki" max={3} used={0} onChange={onChange} />);

    await userEvent.click(available(1));

    expect(available(2)).toBeEnabled();
  });
});

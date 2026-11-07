import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { NpcFateControls } from './NpcFateControls';

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const setup = (props: Partial<React.ComponentProps<typeof NpcFateControls>> = {}) => {
  const onChange = vi.fn();
  renderWithProviders(
    <NpcFateControls
      name="Goblin"
      fate={null}
      deathSaves={null}
      revealed={false}
      onChange={onChange}
      {...props}
    />,
  );
  return onChange;
};
const success = (n: number) => screen.getByRole('button', { name: fill(t.deathSuccess, { n }) });
const failure = (n: number) => screen.getByRole('button', { name: fill(t.deathFailure, { n }) });

describe('NpcFateControls', () => {
  it('sem destino pergunta o que acontece e oferece testes ou morto', async () => {
    const onChange = setup();
    expect(screen.getByText(fill(t.chooseFate, { name: 'Goblin' }))).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.fateDead }));
    expect(onChange).toHaveBeenCalledWith({ fate: 'dead' });
    await userEvent.click(screen.getByRole('button', { name: t.fateDeathSaves }));
    expect(onChange).toHaveBeenCalledWith({ fate: 'death_saves' });
  });

  it('marcar a 2ª falha define as falhas em 2 e não mexe nos sucessos', async () => {
    const onChange = setup({ fate: 'death_saves', deathSaves: { successes: 1, failures: 0 } });
    expect(success(1)).toHaveAttribute('aria-pressed', 'true');
    expect(success(2)).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(failure(2));
    expect(onChange).toHaveBeenCalledWith({ deathSaves: { successes: 1, failures: 2 } });
  });

  it('clicar na marca mais alta desmarca uma', async () => {
    const onChange = setup({ fate: 'death_saves', deathSaves: { successes: 0, failures: 2 } });
    await userEvent.click(failure(2));
    expect(onChange).toHaveBeenCalledWith({ deathSaves: { successes: 0, failures: 1 } });
  });

  it('3 sucessos mostram Estável', () => {
    setup({ fate: 'death_saves', deathSaves: { successes: 3, failures: 0 } });
    expect(screen.getByText(t.stable)).toBeInTheDocument();
  });

  it('em testes também oferece Morto', async () => {
    const onChange = setup({ fate: 'death_saves', deathSaves: { successes: 0, failures: 0 } });
    await userEvent.click(screen.getByRole('button', { name: t.fateDead }));
    expect(onChange).toHaveBeenCalledWith({ fate: 'dead' });
  });

  it('morto não revelado oferece revelar, desfazer e avisa o que os jogadores veem', async () => {
    const onChange = setup({ fate: 'dead' });
    expect(screen.getByText(t.deathHiddenHint)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.revealDeath }));
    expect(onChange).toHaveBeenCalledWith({ deathRevealed: true });
    await userEvent.click(screen.getByRole('button', { name: t.undoDead }));
    expect(onChange).toHaveBeenCalledWith({ fate: 'death_saves' });
  });

  it('morto revelado oferece esconder e desfazer, sem o aviso', async () => {
    const onChange = setup({ fate: 'dead', revealed: true });
    expect(screen.queryByText(t.deathHiddenHint)).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.hideDeath }));
    expect(onChange).toHaveBeenCalledWith({ deathRevealed: false });
    expect(screen.getByRole('button', { name: t.undoDead })).toBeInTheDocument();
  });
});

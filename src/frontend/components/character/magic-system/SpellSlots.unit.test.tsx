import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SpellSlots } from './SpellSlots';

function renderSlots(slots: Record<string, { max: number; used: number }>) {
  const onSlotsChange = vi.fn();
  renderWithProviders(
    <SpellSlots slots={slots} onSlotsChange={onSlotsChange} systemLabel="Spell Slots" />,
  );
  return { onSlotsChange };
}

describe('SpellSlots', () => {
  it('o nome de cada espaço diz se está disponível ou gasto, sem aria-pressed', () => {
    renderSlots({ '1': { max: 2, used: 1 } });

    const available = screen.getByRole('button', { name: 'Level 1 slot 1, available' });
    const spent = screen.getByRole('button', { name: 'Level 1 slot 2, spent' });
    expect(available).not.toHaveAttribute('aria-pressed');
    expect(spent).not.toHaveAttribute('aria-pressed');
  });

  it('tocar num espaço disponível gasta um; num gasto, recupera um', async () => {
    const { onSlotsChange } = renderSlots({ '1': { max: 2, used: 1 } });

    await userEvent.click(screen.getByRole('button', { name: 'Level 1 slot 1, available' }));
    expect(onSlotsChange).toHaveBeenLastCalledWith('1', 2, 2);

    await userEvent.click(screen.getByRole('button', { name: 'Level 1 slot 2, spent' }));
    expect(onSlotsChange).toHaveBeenLastCalledWith('1', 2, 0);
  });

  it('o rótulo do círculo vem da tradução, sem "º" fixo', () => {
    renderSlots({ '3': { max: 1, used: 0 } });

    expect(screen.getByText('Lv 3')).toBeInTheDocument();
    expect(screen.queryByText('3º')).not.toBeInTheDocument();
  });
});

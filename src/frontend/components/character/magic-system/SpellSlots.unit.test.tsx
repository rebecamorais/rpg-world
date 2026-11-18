import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SpellSlots } from './SpellSlots';

function renderSlots(slots: Record<string, { max: number; used: number }>) {
  const onSlotsChange = vi.fn();
  renderWithProviders(
    <SpellSlots slots={slots} onSlotsChange={onSlotsChange} systemLabel="Spell slots" />,
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

  it('nível sem espaços fica legível: cor de texto vazio, sem opacidade', () => {
    renderSlots({ '1': { max: 2, used: 0 } });

    const empty = screen.getByText('Lv 4');
    expect(empty).toHaveClass('text-placeholder');
    expect(empty.closest('[class*="opacity-"]')).toBeNull();
  });

  it('o espaço gasto tem contorno forte e um traço, não só a cor', () => {
    renderSlots({ '1': { max: 2, used: 1 } });

    const spent = screen
      .getByRole('button', { name: 'Level 1 slot 2, spent' })
      .querySelector('[data-slot-mark]');
    expect(spent).toHaveAttribute('data-slot-mark', 'spent');
    expect(spent).toHaveClass('border-info-flare', 'after:bg-info-flare');
    expect(spent).not.toHaveClass('border-info-muted');
  });

  it('cada espaço chega a 44px no toque, e os de um nível não quebram numa grade fixa', () => {
    renderSlots({ '1': { max: 4, used: 0 } });

    const slot = screen.getByRole('button', { name: 'Level 1 slot 1, available' });
    expect(slot).toHaveClass('size-6', 'pointer-coarse:size-11');
    // The levels wrap as a whole (flex-wrap), not in five fixed columns that split 4 into 2 + 2
    expect(slot.closest('[data-rest-focus]')).not.toHaveClass('grid-cols-5');
  });

  it('o rótulo do círculo vem da tradução, sem "º" fixo', () => {
    renderSlots({ '3': { max: 1, used: 0 } });

    expect(screen.getByText('Lv 3')).toBeInTheDocument();
    expect(screen.queryByText('3º')).not.toBeInTheDocument();
  });
});

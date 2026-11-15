import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { MAX_QUANTITY, QuantityStepper, RemoveItemButton } from './QuantityStepper';

function setup(quantity: number) {
  const onQuantity = vi.fn();
  renderWithProviders(<QuantityStepper name="Rope" quantity={quantity} onQuantity={onQuantity} />);
  return { onQuantity };
}

describe('QuantityStepper', () => {
  it('com 1, o − fica desativado e não vira lixeira', async () => {
    const { onQuantity } = setup(1);

    const less = screen.getByRole('button', { name: 'One less Rope' });
    expect(less).toBeDisabled();
    await userEvent.click(less);
    expect(onQuantity).not.toHaveBeenCalled();
    expect(screen.queryByRole('button', { name: 'Remove Rope' })).not.toBeInTheDocument();
  });

  it('com 3, − e + mudam a quantidade', async () => {
    const { onQuantity } = setup(3);

    await userEvent.click(screen.getByRole('button', { name: 'One less Rope' }));
    expect(onQuantity).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'One more Rope' }));
    expect(onQuantity).toHaveBeenLastCalledWith(4);
    expect(screen.getByLabelText('Quantity of Rope')).toHaveTextContent('3');
  });

  it('no máximo, + fica desativado', () => {
    setup(MAX_QUANTITY);

    expect(screen.getByRole('button', { name: 'One more Rope' })).toBeDisabled();
  });
});

describe('RemoveItemButton', () => {
  it('remove com o nome do item no rótulo', async () => {
    const onRemove = vi.fn();
    renderWithProviders(<RemoveItemButton name="Rope" onRemove={onRemove} />);

    await userEvent.click(screen.getByRole('button', { name: 'Remove Rope' }));
    expect(onRemove).toHaveBeenCalledOnce();
  });
});

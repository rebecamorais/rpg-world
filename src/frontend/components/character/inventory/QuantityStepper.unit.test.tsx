import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { MAX_QUANTITY, QuantityStepper } from './QuantityStepper';

function setup(quantity: number) {
  const onQuantity = vi.fn();
  const onRemove = vi.fn();
  renderWithProviders(
    <QuantityStepper name="Rope" quantity={quantity} onQuantity={onQuantity} onRemove={onRemove} />,
  );
  return { onQuantity, onRemove };
}

describe('QuantityStepper', () => {
  it('com 1, o botão esquerdo é a lixeira e remove', async () => {
    const { onQuantity, onRemove } = setup(1);

    expect(screen.queryByRole('button', { name: 'One less Rope' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove Rope' }));

    expect(onRemove).toHaveBeenCalledOnce();
    expect(onQuantity).not.toHaveBeenCalled();
  });

  it('com 3, − e + mudam a quantidade', async () => {
    const { onQuantity, onRemove } = setup(3);

    await userEvent.click(screen.getByRole('button', { name: 'One less Rope' }));
    expect(onQuantity).toHaveBeenLastCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'One more Rope' }));
    expect(onQuantity).toHaveBeenLastCalledWith(4);
    expect(onRemove).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Quantity of Rope')).toHaveTextContent('3');
  });

  it('no máximo, + fica desativado', () => {
    setup(MAX_QUANTITY);

    expect(screen.getByRole('button', { name: 'One more Rope' })).toBeDisabled();
  });
});

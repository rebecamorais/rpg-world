import { useState } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { NumberInput } from './number-input';

/** A NumberInput wired to state, like a draft field, plus a second field to blur into. */
function Harness(props: Partial<React.ComponentProps<typeof NumberInput>> & { initial?: number }) {
  const { initial = 30, onValueChange, ...rest } = props;
  const [value, setValue] = useState(initial);
  return (
    <>
      <NumberInput
        aria-label="Speed"
        value={value}
        onValueChange={(v) => {
          setValue(v);
          onValueChange?.(v);
        }}
        {...rest}
      />
      <button onClick={() => setValue((v) => v + 1)}>Outside +1</button>
      <output>{value}</output>
    </>
  );
}

const field = () => screen.getByRole('textbox', { name: 'Speed' });

describe('NumberInput', () => {
  it('apagar deixa o campo vazio, sem voltar ao valor anterior nem a 0', async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    renderWithProviders(<Harness onValueChange={onValueChange} />);

    await user.clear(field());

    expect(field()).toHaveValue('');
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('cada número válido vai para o valor enquanto digita', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.clear(field());
    await user.type(field(), '45');

    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('45');
  });

  it('o erro só aparece depois de sair do campo, e some quando o valor fica válido', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness min={0} max={100} />);

    await user.clear(field());
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();

    await user.tab();
    expect(screen.getByText('Enter a number')).toBeInTheDocument();
    expect(field()).toHaveAttribute('aria-invalid', 'true');
    expect(field()).toHaveAccessibleDescription('Enter a number');
    // The last valid value is kept
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('30');

    await user.type(field(), '250');
    expect(screen.getByText('Between 0 and 100')).toBeInTheDocument();

    await user.clear(field());
    await user.type(field(), '25');
    expect(screen.queryByText(/Between/)).not.toBeInTheDocument();
    expect(field()).not.toHaveAttribute('aria-invalid');
  });

  it('decimais com vírgula ou ponto quando permitidos; senão, pede inteiro', async () => {
    const user = userEvent.setup();
    const { unmount } = renderWithProviders(<Harness decimal />);

    await user.clear(field());
    await user.type(field(), '7,5');
    expect(screen.getByRole('status', { hidden: true })).toHaveTextContent('7.5');
    unmount();

    renderWithProviders(<Harness />);
    await user.clear(field());
    await user.type(field(), '7.5');
    await user.tab();
    expect(screen.getByText('Whole numbers only')).toBeInTheDocument();
  });

  it('uma mudança de fora (botão +/-) substitui o texto em edição', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Harness />);

    await user.clear(field());
    await user.tab();
    await user.click(screen.getByRole('button', { name: 'Outside +1' }));

    expect(field()).toHaveValue('31');
    expect(screen.queryByText('Enter a number')).not.toBeInTheDocument();
  });

  it('avisa a validade, para um diálogo segurar o botão de salvar', async () => {
    const user = userEvent.setup();
    const onValidityChange = vi.fn();
    renderWithProviders(<Harness onValidityChange={onValidityChange} />);

    await user.clear(field());
    expect(onValidityChange).toHaveBeenLastCalledWith(false);
    await user.type(field(), '9');
    expect(onValidityChange).toHaveBeenLastCalledWith(true);
  });
});

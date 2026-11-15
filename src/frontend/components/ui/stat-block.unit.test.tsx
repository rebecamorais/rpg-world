import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { StatBlock } from './stat-block';

describe('StatBlock', () => {
  it('mostra só o ícone e o valor; o nome fica para o leitor de tela', () => {
    renderWithProviders(
      <StatBlock icon="stopwatch" label="Initiative">
        2
      </StatBlock>,
    );

    // No visible label: it opens from the icon
    expect(screen.getByText('Initiative:')).toHaveClass('sr-only');
    expect(screen.getByRole('button', { name: 'What is Initiative?' })).toBeInTheDocument();
  });

  it('o ícone abre o nome e a explicação ao tocar', async () => {
    renderWithProviders(
      <StatBlock icon="stopwatch" label="Initiative" hint="Added to the d20.">
        2
      </StatBlock>,
    );

    await userEvent.click(screen.getByRole('button', { name: 'What is Initiative?' }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Initiative');
    expect(tooltip).toHaveTextContent('Added to the d20.');
  });

  it('sem explicação, o balão mostra só o nome', async () => {
    renderWithProviders(
      <StatBlock icon="boot-prints" label="Speed" unit="m">
        9
      </StatBlock>,
    );

    await userEvent.hover(screen.getByRole('button', { name: 'What is Speed?' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent(/^Speed$/);
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { StatBlock } from './stat-block';

describe('StatBlock', () => {
  it('sem explicação, mostra o rótulo escrito', () => {
    renderWithProviders(
      <StatBlock icon="stopwatch" label="Initiative">
        2
      </StatBlock>,
    );

    expect(screen.getByText('Initiative')).toBeInTheDocument();
  });

  it('com explicação, esconde o rótulo e abre nome e explicação ao tocar no ícone', async () => {
    renderWithProviders(
      <StatBlock icon="stopwatch" label="Initiative" hint="Added to the d20.">
        2
      </StatBlock>,
    );
    expect(screen.queryByText('Initiative')).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'What is Initiative?' }));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('Initiative');
    expect(tooltip).toHaveTextContent('Added to the d20.');
  });
});

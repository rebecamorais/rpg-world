import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { WEBLATE_PROJECT } from '@frontend/constants/site';

import { UntranslatedNotice } from './UntranslatedNotice';

describe('UntranslatedNotice', () => {
  it('é uma nota com o texto e o link para o Weblate', () => {
    renderWithProviders(<UntranslatedNotice />);

    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Description in English for now.');
    const link = screen.getByRole('link', { name: 'Help translate' });
    expect(link).toHaveAttribute('href', WEBLATE_PROJECT);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  // A whole sentence in uppercase is hard to read; text-label is for short labels only
  it('a versão compacta é caption em caixa normal, não text-label', () => {
    renderWithProviders(<UntranslatedNotice compact />);

    const note = screen.getByRole('note');
    expect(note).toHaveClass('text-caption');
    expect(note).not.toHaveClass('text-label');
  });
});

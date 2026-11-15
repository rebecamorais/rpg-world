import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { CROWDIN_PROJECT } from '@frontend/constants/site';

import { UntranslatedNotice } from './UntranslatedNotice';

describe('UntranslatedNotice', () => {
  it('é uma nota com o texto e o link para o Crowdin', () => {
    renderWithProviders(<UntranslatedNotice />);

    const note = screen.getByRole('note');
    expect(note).toHaveTextContent('Description in English for now.');
    const link = screen.getByRole('link', { name: 'Help translate' });
    expect(link).toHaveAttribute('href', CROWDIN_PROJECT);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

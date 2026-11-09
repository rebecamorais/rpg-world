import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { ZoomablePortrait } from './ZoomablePortrait';

const view = { name: messages.avatarUpload.viewOf.replace('{name}', 'Arani') };

describe('ZoomablePortrait', () => {
  it('clicar no avatar abre a imagem ampliada', async () => {
    renderWithProviders(
      <ZoomablePortrait src="https://img.test/a.webp" name="Arani">
        <span>retrato</span>
      </ZoomablePortrait>,
    );

    await userEvent.click(screen.getByRole('button', view));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Arani' })).toBeInTheDocument();
  });

  it('sem imagem é só o retrato', () => {
    renderWithProviders(
      <ZoomablePortrait src={null} name="Arani">
        <span>retrato</span>
      </ZoomablePortrait>,
    );
    expect(screen.getByText('retrato')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});

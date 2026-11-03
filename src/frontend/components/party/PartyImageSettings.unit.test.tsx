import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { PartyImageSettings } from './PartyImageSettings';

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const removeImage = { mutate: vi.fn(), isPending: false };
vi.mock('@frontend/hooks/useParty', () => ({ useParty: () => ({ removeImage }) }));
vi.mock('@frontend/context/FileUploaderContext', () => ({
  useFileUploader: () => ({ upload: vi.fn(), isUploading: false }),
}));

const t = messages.parties.image;
const party = (imageUrl: string | null) => ({ id: 'party-1', imageUrl }) as PartyView;

describe('PartyImageSettings', () => {
  beforeEach(() => vi.clearAllMocks());

  it('sem imagem: explica o que o link mostra e oferece enviar', () => {
    renderWithProviders(<PartyImageSettings party={party(null)} />);

    expect(screen.getByText(t.empty)).toBeVisible();
    expect(screen.getByRole('button', { name: t.upload })).toBeVisible();
    expect(screen.queryByRole('button', { name: t.remove })).not.toBeInTheDocument();
  });

  it('com imagem: mostra, troca e remove depois de confirmar', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true);
    renderWithProviders(<PartyImageSettings party={party('https://images.test/mesa.webp')} />);

    expect(screen.getByRole('img', { name: t.alt })).toHaveAttribute(
      'src',
      'https://images.test/mesa.webp',
    );
    expect(screen.getByRole('button', { name: t.change })).toBeVisible();

    await userEvent.click(screen.getByRole('button', { name: t.remove }));
    expect(removeImage.mutate).toHaveBeenCalled();
  });
});

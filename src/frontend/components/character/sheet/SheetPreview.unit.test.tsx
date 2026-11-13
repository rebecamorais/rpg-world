import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SheetPreview } from './SheetPreview';

vi.mock('./SheetViewer', () => ({
  SheetViewer: ({ characterId }: { characterId: string }) => <p>sheet of {characterId}</p>,
}));

const t = messages.sheetViewer;

describe('SheetPreview', () => {
  it('abre a ficha inteira sobre a página, só leitura, sem "Editar ficha" para quem não pode', async () => {
    renderWithProviders(
      <SheetPreview characterId="c1" name="Arani" source={{ kind: 'party', partyId: 'p1' }} />,
    );

    await userEvent.click(screen.getByRole('button', { name: `${t.open} Arani` }));

    const panel = await screen.findByRole('dialog', { name: 'Arani' });
    expect(panel).toHaveTextContent(t.description);
    expect(await screen.findByText('sheet of c1')).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: new RegExp(t.edit) })).not.toBeInTheDocument();
  });

  it('quem pode editar ganha "Editar ficha", que abre a página da ficha numa aba nova', async () => {
    renderWithProviders(
      <SheetPreview characterId="c1" name="Arani" source={{ kind: 'own' }} canEdit />,
    );

    await userEvent.click(screen.getByRole('button', { name: `${t.open} Arani` }));

    const edit = await screen.findByRole('link', { name: `${t.edit} ${t.newTab}` });
    expect(edit).toHaveAttribute('href', '/system/DnD_5e/character/c1');
    expect(edit).toHaveAttribute('target', '_blank');
  });
});

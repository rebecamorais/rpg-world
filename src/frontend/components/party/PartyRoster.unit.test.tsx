import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import type { RosterCharacter } from '@backend/contexts/parties/domain/PartyView';

import { PartyRoster } from './PartyRoster';

const character = (overrides: Partial<RosterCharacter> = {}): RosterCharacter => ({
  characterId: 'c1',
  ownerId: 'u1',
  name: 'Arani',
  avatarUrl: null,
  race: 'Elfa',
  class: 'Maga',
  level: 3,
  accentColor: null,
  ...overrides,
});
const view = { name: messages.avatarUpload.viewOf.replace('{name}', 'Arani') };

describe('PartyRoster', () => {
  it('amplia a imagem de quem está na mesa', async () => {
    renderWithProviders(
      <PartyRoster roster={[character({ avatarUrl: 'https://img.test/a.webp' })]} people={[]} />,
    );

    await userEvent.click(screen.getByRole('button', view));

    expect(screen.getByRole('img', { name: 'Arani' })).toBeInTheDocument();
  });

  it('sem imagem não mostra o botão', () => {
    renderWithProviders(<PartyRoster roster={[character()]} people={[]} />);

    expect(screen.queryByRole('button', view)).not.toBeInTheDocument();
  });

  it('a ficha de colega é privada: "Ver ficha" e link só nos próprios personagens', () => {
    renderWithProviders(
      <PartyRoster
        roster={[character(), character({ characterId: 'c2', ownerId: 'u2', name: 'Bran' })]}
        people={[]}
        myCharacterIds={['c2']}
      />,
    );

    const open = messages.sheetViewer.open;
    expect(screen.queryByRole('button', { name: `${open} Arani` })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: `${open} Bran` })).toBeInTheDocument();
    // No link to a sheet the player can't open
    expect(screen.queryByRole('link')).not.toBeInTheDocument();
  });

  it('mesa vazia: explica e oferece a ação de quem olha', () => {
    renderWithProviders(
      <PartyRoster roster={[]} people={[]} emptyAction={<button type="button">bring</button>} />,
    );

    expect(screen.getByText(messages.parties.page.noCharactersPlayer)).toBeInTheDocument();
    expect(screen.getByText(messages.parties.page.noCharactersPlayerHint)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'bring' })).toBeInTheDocument();
  });

  it('"Jogado por" em caixa normal: o nome de usuário diferencia maiúsculas', () => {
    renderWithProviders(
      <PartyRoster
        roster={[character()]}
        people={[{ userId: 'u1', username: 'Bia_X', avatarUrl: null, status: 'active' }]}
      />,
    );

    const playedBy = screen.getByText('Played by @Bia_X');
    expect(playedBy).toHaveClass('text-caption');
    expect(playedBy).not.toHaveClass('text-label');
  });
});

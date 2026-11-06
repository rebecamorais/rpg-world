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
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { EditionCard } from './EditionCard';

describe('EditionCard', () => {
  it('escolher uma edição salva só a edição', async () => {
    const { saveNow } = renderWithCharacter(<EditionCard />, {
      ...createDnD5eCharacter('owner', 'Thor'),
      id: 'c1',
    });

    expect(screen.getByText(messages.classResources.newTitle)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: '2024' }));

    expect(saveNow).toHaveBeenCalledWith({ edition: '2024' });
  });
});

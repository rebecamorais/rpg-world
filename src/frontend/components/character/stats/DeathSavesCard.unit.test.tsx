import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { DeathSavesCard } from './DeathSavesCard';

function renderCard(deathSaves = { successes: 1, failures: 2 }) {
  const character = { ...createDnD5eCharacter('o', 'x'), id: 'c1', deathSaves } as DnD5eCharacter;
  return renderWithCharacter(<DeathSavesCard />, character);
}

describe('DeathSavesCard', () => {
  it('o ícone de zerar limpa sucessos e falhas', async () => {
    const { draft } = renderCard();

    await userEvent.click(screen.getByRole('button', { name: 'Reset death saves' }));

    expect(draft().deathSaves).toEqual({ successes: 0, failures: 0 });
  });

  it('sem nada marcado, zerar fica desabilitado', () => {
    renderCard({ successes: 0, failures: 0 });

    expect(screen.getByRole('button', { name: 'Reset death saves' })).toBeDisabled();
  });
});

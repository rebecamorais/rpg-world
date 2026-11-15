import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import CharacterNavSection from './CharacterNavSection';

const NAME = 'Revisão F2 A Chilli, a gata que comanda a mesa';

vi.mock('next/navigation', () => ({ useParams: () => ({}), usePathname: () => '/x' }));
vi.mock('@frontend/hooks/useCharacter', () => ({
  useCharacter: () => ({
    character: { id: 'c1', name: NAME, system: 'DnD_5e', class: 'wizard', avatarUrl: null },
  }),
}));

describe('CharacterNavSection', () => {
  it('nome e classe cortados no menu guardam o texto inteiro no title', () => {
    renderWithProviders(<CharacterNavSection characterId="c1" />);

    expect(screen.getByText(NAME)).toHaveAttribute('title', NAME);
    const wizard = messages.spellsData.classes.wizard;
    expect(screen.getByText(wizard)).toHaveAttribute('title', wizard);
  });
});

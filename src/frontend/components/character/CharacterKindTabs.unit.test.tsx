import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { CharacterKindTabs } from './CharacterKindTabs';

const t = messages.characters.kinds;

describe('CharacterKindTabs', () => {
  it('liga as duas abas e marca a atual', () => {
    renderWithProviders(<CharacterKindTabs current="npc" />);

    expect(screen.getByRole('link', { name: t.pc })).toHaveAttribute('href', '/characters');
    expect(screen.getByRole('link', { name: t.pc })).not.toHaveAttribute('aria-current');
    const npcs = screen.getByRole('link', { name: t.npc });
    expect(npcs).toHaveAttribute('href', '/characters/npcs');
    expect(npcs).toHaveAttribute('aria-current', 'page');
  });

  it('sublinhadas como as abas da mesa, não em pílula', () => {
    renderWithProviders(<CharacterKindTabs current="pc" />);

    const current = screen.getByRole('link', { name: t.pc });
    const other = screen.getByRole('link', { name: t.npc });
    expect(current).toHaveClass('border-b-2', 'border-primary');
    expect(other).toHaveClass('border-b-2', 'border-transparent');
    expect(current).not.toHaveClass('bg-background');
    expect(screen.getByRole('navigation', { name: t.label })).toHaveClass('border-b');
  });
});

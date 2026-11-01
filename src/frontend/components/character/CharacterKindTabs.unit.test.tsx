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
});

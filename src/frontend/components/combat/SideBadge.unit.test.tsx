import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { OwnerOrSideBadge, SideBadge } from './SideBadge';

const t = messages.combat;

describe('SideBadge', () => {
  it.each([
    ['player', t.player],
    ['ally', t.ally],
    ['neutral', t.neutral],
    ['enemy', t.enemy],
  ] as const)('mostra o texto do lado %s', (side, label) => {
    renderWithProviders(<SideBadge side={side} />);
    expect(screen.getByText(label)).toBeVisible();
  });
});

describe('OwnerOrSideBadge', () => {
  // Usernames are case-sensitive: uppercase (text-label) turned @playerChilli into @PLAYERCHILLI
  it('mostra o @username na caixa dele, sem text-label', () => {
    renderWithProviders(<OwnerOrSideBadge side="player" ownerUsername="playerChilli" />);

    const name = screen.getByText('@playerChilli');
    expect(name.parentElement).toHaveClass('text-caption');
    expect(name.parentElement).not.toHaveClass('text-label');
  });

  it('sem username, mostra o lado', () => {
    renderWithProviders(<OwnerOrSideBadge side="player" ownerUsername={null} />);
    expect(screen.getByText(t.player)).toBeVisible();
  });
});

import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import type { RolePlayCard as Card } from '@backend/contexts/parties/domain/PartyView';

import { RolePlayCard } from './RolePlayCard';

const t = messages.parties.page;

const card = (overrides: Partial<Card> = {}): Card => ({
  characterId: 'c1',
  ownerId: 'u1',
  name: 'Arani',
  avatarUrl: null,
  race: 'Elfa',
  class: 'Maga',
  level: 3,
  accentColor: null,
  ownerUsername: 'bia',
  personalityTraits: 'Curiosa demais',
  ideals: 'Saber',
  bonds: 'O mestre dela',
  flaws: 'Orgulho',
  passivePerception: 14,
  passiveInsight: 12,
  ...overrides,
});

describe('RolePlayCard', () => {
  it('mostra as passivas e linka para a ficha da mesa', () => {
    renderWithProviders(<RolePlayCard partyId="p1" card={card()} />);

    expect(screen.getByRole('link', { name: /Arani/ })).toHaveAttribute(
      'href',
      '/parties/p1/characters/c1',
    );
    expect(screen.getByText(t.passivePerception).nextSibling).toHaveTextContent('14');
    expect(screen.getByText(t.passiveInsight).nextSibling).toHaveTextContent('12');
    expect(screen.getByText('Elfa · Maga · Level 3')).toBeInTheDocument();
    expect(screen.getByText('Played by @bia')).toBeInTheDocument();
    expect(screen.getByText('Curiosa demais')).toBeInTheDocument();
    expect(screen.getByText('Orgulho')).toBeInTheDocument();
  });

  it('sem lore não mostra rótulos vazios', () => {
    renderWithProviders(
      <RolePlayCard
        partyId="p1"
        card={card({ personalityTraits: null, ideals: null, bonds: null, flaws: null })}
      />,
    );

    for (const label of [t.personalityTraits, t.ideals, t.bonds, t.flaws]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });
});

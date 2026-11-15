import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { PartySheetUnavailable } from './PartySheetUnavailable';

const t = messages.parties.sheet;

describe('PartySheetUnavailable', () => {
  it('ficha de colega: diz que é privada e volta para a mesa', () => {
    renderWithProviders(<PartySheetUnavailable partyId="p1" reason="private" />);

    expect(screen.getByText(t.privateTitle)).toBeVisible();
    expect(screen.getByText(t.privateDescription)).toBeVisible();
    expect(screen.queryByText(messages.characters.notFoundOrNoPermission)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.back })).toHaveAttribute('href', '/parties/p1');
  });

  it('o mestre, com personagem que não está na mesa: diz isso', () => {
    renderWithProviders(<PartySheetUnavailable partyId="p1" reason="missing" />);

    expect(screen.getByText(t.missingTitle)).toBeVisible();
    expect(screen.queryByText(t.privateTitle)).not.toBeInTheDocument();
  });
});

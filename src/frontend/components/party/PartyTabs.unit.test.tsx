import { screen, within } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PartyTabs } from './PartyTabs';

vi.mock('next/navigation', () => ({ usePathname: () => '/parties/p1' }));
const combat = vi.hoisted(() => ({ encounter: null as { round: number } | null }));
vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => combat }));

const t = messages.parties.tabs;
const round = (n: number) => messages.combat.round.replace('{round}', String(n));
const combatRound = (n: number) => t.combatRound.replace('{round}', String(n));

/** The tab bars: the first is the desktop one (under the title), the second the phone's. */
function bars() {
  const [desktop, phone] = screen.getAllByRole('navigation', { name: t.label });
  return { desktop, phone };
}

describe('PartyTabs', () => {
  beforeEach(() => {
    combat.encounter = null;
  });

  it('as abas do desktop têm ícone, como as do celular', () => {
    renderWithProviders(<PartyTabs partyId="p1" />);
    const { desktop, phone } = bars();

    for (const bar of [desktop, phone]) {
      for (const tab of [t.overview, t.combat, t.journal, t.chest]) {
        expect(within(bar).getByRole('link', { name: tab }).querySelector('svg')).not.toBeNull();
      }
    }
  });

  it('com combate rolando, a rodada aparece nas duas barras', () => {
    combat.encounter = { round: 2 };
    renderWithProviders(<PartyTabs partyId="p1" />);
    const { desktop, phone } = bars();

    const desktopCombat = within(desktop).getByRole('link', { name: combatRound(2) });
    expect(desktopCombat).toHaveTextContent(round(2));
    // The phone has room for the number only; screen readers still hear "Combat, round 2"
    const phoneCombat = within(phone).getByRole('link', { name: combatRound(2) });
    expect(within(phoneCombat).getByText('2')).toBeInTheDocument();
  });

  it('preparando o combate (rodada 0), nenhuma barra mostra rodada', () => {
    combat.encounter = { round: 0 };
    renderWithProviders(<PartyTabs partyId="p1" />);
    const { desktop, phone } = bars();

    expect(within(desktop).getByRole('link', { name: t.combat })).toBeInTheDocument();
    expect(within(phone).getByRole('link', { name: t.combat })).toBeInTheDocument();
  });
});

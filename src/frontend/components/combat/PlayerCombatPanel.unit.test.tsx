import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerEncounterView } from '@backend/contexts/combat/domain/Encounter';

import { PlayerCombatPanel } from './PlayerCombatPanel';

const hook = {
  encounter: null as PlayerEncounterView | null,
  endTurn: { mutate: vi.fn(), isPending: false },
};

vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => hook }));
vi.mock('sonner', () => ({ toast: vi.fn() }));

const t = messages.combat;

const view = (current: 'mine' | 'theirs'): PlayerEncounterView => ({
  role: 'player',
  round: 3,
  turns: [
    {
      participantId: 'a',
      name: 'Arani',
      isCurrent: current === 'mine',
      isMine: true,
      conditions: [],
    },
    {
      participantId: 'b',
      name: 'Goblin 1',
      isCurrent: current === 'theirs',
      isMine: false,
      conditions: [],
    },
  ],
});

describe('PlayerCombatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.encounter = null;
  });

  it('avisa quando a vez dele chega, uma vez só', () => {
    hook.encounter = view('theirs');
    const { rerender } = renderWithProviders(<PlayerCombatPanel partyId="p" live />);
    expect(toast).not.toHaveBeenCalled();

    hook.encounter = view('mine');
    rerender(<PlayerCombatPanel partyId="p" live />);
    hook.encounter = { ...view('mine') };
    rerender(<PlayerCombatPanel partyId="p" live />);

    expect(toast).toHaveBeenCalledTimes(1);
    // Themed: the swords icon and the character's color on the border
    expect(toast).toHaveBeenCalledWith(
      t.yourTurnToast,
      expect.objectContaining({
        icon: expect.anything(),
        className: expect.stringContaining('primary'),
      }),
    );
  });

  it('sem combate não mostra nada', () => {
    const { container } = renderWithProviders(<PlayerCombatPanel partyId="p" live />);
    expect(container).toBeEmptyDOMElement();
  });

  it('na rodada 0: o mestre está preparando', () => {
    hook.encounter = { role: 'player', round: 0, turns: [] };
    renderWithProviders(<PlayerCombatPanel partyId="p" live />);
    expect(screen.getByText(t.playerPreparing)).toBeInTheDocument();
  });

  it('"Encerrar meu turno" só aparece na vez dele, e encerra o turno daquele participante', async () => {
    hook.encounter = view('theirs');
    const { unmount } = renderWithProviders(<PlayerCombatPanel partyId="p" live />);
    expect(screen.queryByRole('button', { name: t.endMyTurn })).not.toBeInTheDocument();
    unmount();

    hook.encounter = view('mine');
    renderWithProviders(<PlayerCombatPanel partyId="p" live />);
    expect(screen.getByText(t.yourTurn)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.endMyTurn }));
    expect(hook.endTurn.mutate).toHaveBeenCalledWith('a');
  });

  it('mostra só nomes e a vez: nenhum número além da rodada', () => {
    hook.encounter = view('theirs');
    renderWithProviders(<PlayerCombatPanel partyId="p" live />);

    const list = screen.getByRole('list', { name: t.order });
    expect(
      within(list)
        .getAllByRole('listitem')
        .map((li) => li.textContent),
    ).toEqual([expect.stringContaining('Arani'), expect.stringContaining('Goblin 1')]);
    expect(within(list).getByText('Goblin 1').closest('li')).toHaveAttribute(
      'aria-current',
      'true',
    );
    // "Goblin 1" carries its own label digit; nothing else in the list is a number
    expect(list.textContent!.replace('Goblin 1', '')).not.toMatch(/\d/);
  });
});

import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerEncounterView } from '@backend/contexts/combat/domain/Encounter';

import { useYourTurnToast } from './useYourTurnToast';

const hook = { encounter: null as PlayerEncounterView | null };

vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => hook }));
vi.mock('sonner', () => ({ toast: vi.fn() }));

const turn = (participantId: string, isMine: boolean, isCurrent: boolean) => ({
  participantId,
  side: 'player' as const,
  name: participantId,
  avatarUrl: null,
  life: 'normal' as const,
  isCurrent,
  isMine,
  conditions: [],
  initiative: null,
  characterId: null,
  ownerUsername: null,
});

const view = (current: 'mine' | 'theirs'): PlayerEncounterView => ({
  role: 'player',
  round: 3,
  hiddenTurn: false,
  turns: [turn('a', true, current === 'mine'), turn('b', false, current === 'theirs')],
});

function Probe() {
  useYourTurnToast('p');
  return null;
}

describe('useYourTurnToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.encounter = null;
  });

  it('avisa quando a vez dele chega, uma vez só', () => {
    hook.encounter = view('theirs');
    const { rerender } = renderWithProviders(<Probe />);
    expect(toast).not.toHaveBeenCalled();

    hook.encounter = view('mine');
    rerender(<Probe />);
    hook.encounter = { ...view('mine') };
    rerender(<Probe />);

    expect(toast).toHaveBeenCalledTimes(1);
    // Themed: the swords icon and the primary color on the border
    expect(toast).toHaveBeenCalledWith(
      messages.combat.yourTurnToast,
      expect.objectContaining({
        icon: expect.anything(),
        className: expect.stringContaining('primary'),
      }),
    );
  });

  it('sem combate não avisa nada', () => {
    renderWithProviders(<Probe />);
    expect(toast).not.toHaveBeenCalled();
  });
});

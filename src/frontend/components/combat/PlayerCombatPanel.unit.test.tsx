import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PlayerEncounterView } from '@backend/contexts/combat/domain/Encounter';

import { PlayerCombatPanel } from './PlayerCombatPanel';

const PRONE = {
  key: 'dnd5e:srd-5.2:condition:prone',
  id: 'prone',
  edition: '2024',
  name: 'Caído',
  description: 'Caído.',
  maxLevel: null,
};

const hook = {
  encounter: null as PlayerEncounterView | null,
  endTurn: { mutate: vi.fn(), isPending: false },
  setConditions: { mutate: vi.fn(), isPending: false },
  setMyInitiative: { mutate: vi.fn(), isPending: false },
};

vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => hook }));
vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: [PRONE],
    byKey: new Map([[PRONE.key, PRONE]]),
    isLoading: false,
  }),
}));
vi.mock('sonner', () => ({ toast: vi.fn() }));

const t = messages.combat;

const view = (current: 'mine' | 'theirs'): PlayerEncounterView => ({
  role: 'player',
  round: 3,
  hiddenTurn: false,
  turns: [
    {
      participantId: 'a',
      side: 'player',
      name: 'Arani',
      avatarUrl: null,
      life: 'normal',
      isCurrent: current === 'mine',
      isMine: true,
      conditions: [],
      initiative: null,
      characterId: null,
      ownerUsername: null,
    },
    {
      participantId: 'b',
      side: 'enemy',
      name: 'Goblin 1',
      avatarUrl: null,
      life: 'normal',
      isCurrent: current === 'theirs',
      isMine: false,
      conditions: [],
      initiative: null,
      characterId: null,
      ownerUsername: null,
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
    const { rerender } = renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(toast).not.toHaveBeenCalled();

    hook.encounter = view('mine');
    rerender(<PlayerCombatPanel partyId="p" edition="2024" live />);
    hook.encounter = { ...view('mine') };
    rerender(<PlayerCombatPanel partyId="p" edition="2024" live />);

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
    const { container } = renderWithProviders(
      <PlayerCombatPanel partyId="p" edition="2024" live />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('na rodada 0: o mestre está preparando', () => {
    hook.encounter = { role: 'player', round: 0, hiddenTurn: false, turns: [] };
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(screen.getByText(t.playerPreparing)).toBeInTheDocument();
  });

  it('rodada 0: a própria linha com "Sua iniciativa" e sem as outras', () => {
    hook.encounter = { ...view('theirs'), round: 0 };
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(screen.getByText(t.playerPreparing)).toBeInTheDocument();
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(1);
    expect(within(items[0]).getByLabelText(t.yourInitiative)).toBeInTheDocument();
    expect(screen.queryByText('Goblin 1')).not.toBeInTheDocument();
  });

  it('"Encerrar meu turno" só aparece na vez dele, e encerra o turno daquele participante', async () => {
    hook.encounter = view('theirs');
    const { unmount } = renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(screen.queryByRole('button', { name: t.endMyTurn })).not.toBeInTheDocument();
    unmount();

    hook.encounter = view('mine');
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(screen.getByText(t.yourTurn)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.endMyTurn }));
    expect(hook.endTurn.mutate).toHaveBeenCalledWith('a');
  });

  it('mostra só nomes e a vez: nenhum número além da rodada', () => {
    hook.encounter = view('theirs');
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);

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

  it('os selos aparecem em todas as linhas, mas o botão "Condições" só na própria', async () => {
    const turns = view('theirs').turns.map((turn) => ({
      ...turn,
      conditions: [{ key: PRONE.key, level: null }],
    }));
    hook.encounter = { role: 'player', round: 3, hiddenTurn: false, turns };
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);

    expect(screen.getAllByRole('button', { name: 'Caído, condition' })).toHaveLength(2);
    const mine = screen.getByRole('button', {
      name: `${t.conditionsOf.replace('{name}', 'Arani')}`,
    });
    expect(mine).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /^Conditions of/ })).toHaveLength(1);

    await userEvent.click(mine);
    await userEvent.click(screen.getByRole('switch', { name: 'Caído' }));
    expect(hook.setConditions.mutate).toHaveBeenCalledWith({ participantId: 'a', conditions: [] });
  });

  const withTurns = (
    turns: Partial<PlayerEncounterView['turns'][number]>[],
    hiddenTurn = false,
  ) => {
    const base = view('theirs').turns[1];
    hook.encounter = {
      role: 'player',
      round: 3,
      hiddenTurn,
      turns: turns.map((turn, i) => ({
        ...base,
        isCurrent: false,
        participantId: `x${i}`,
        ...turn,
      })),
    };
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
  };

  it('mostra o lado de cada participante com texto, inclusive no turno atual', () => {
    withTurns([
      { side: 'player', name: 'Arani', isCurrent: true, isMine: true },
      { side: 'enemy', name: 'Orc' },
      { side: 'ally', name: 'Bardo' },
      { side: 'neutral', name: 'Mercador' },
    ]);
    const items = within(screen.getByRole('list', { name: t.order })).getAllByRole('listitem');
    expect(items[0]).toHaveTextContent(t.player);
    expect(items[1]).toHaveTextContent(t.enemy);
    expect(items[2]).toHaveTextContent(t.ally);
    expect(items[3]).toHaveTextContent(t.neutral);
  });

  it('anônimo mostra "Inimigo desconhecido" sem imagem e sem botão de ampliar', () => {
    withTurns([{ side: 'enemy', name: null, avatarUrl: 'https://x/a.png' }]);
    expect(screen.getByText(t.unknownEnemy)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
    expect(document.querySelector('img')).toBeNull();
  });

  it('anônimo que vira aliado mostra "Aliado desconhecido"', () => {
    withTurns([{ side: 'ally', name: null }]);
    expect(screen.getByText(t.unknownAlly)).toBeInTheDocument();
  });

  it('anônimo neutro mostra "Neutro desconhecido"', () => {
    withTurns([{ side: 'neutral', name: null }]);
    expect(screen.getByText(t.unknownNeutral)).toBeInTheDocument();
  });

  it('visível com imagem tem o botão de ampliar, sobre o avatar', () => {
    withTurns([{ side: 'enemy', name: 'Orc', avatarUrl: 'https://x/a.png' }]);
    expect(screen.getAllByRole('button')).toHaveLength(1);
    expect(screen.getByRole('button')).toHaveAccessibleName(/Orc/);
  });

  it('visível sem imagem não tem botão de ampliar', () => {
    withTurns([{ side: 'enemy', name: 'Orc', avatarUrl: null }]);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('caído fica com a linha marcada como caída', () => {
    withTurns([{ side: 'enemy', name: 'Orc', life: 'down' }]);
    const li = screen.getByRole('listitem');
    expect(li).toHaveTextContent(t.down);
    // Only the picture and name dim; the labels keep their contrast
    expect(li.className).not.toContain('opacity');
    expect(within(li).getByText('Orc')).toHaveClass('text-muted-foreground');
  });

  it('caído com imagem: o botão de ampliar fica fora do trecho esmaecido', () => {
    withTurns([{ side: 'enemy', name: 'Orc', life: 'down', avatarUrl: 'https://x/a.png' }]);
    const zoom = screen.getByRole('button');
    const dimmed = document.querySelector('.opacity-60');
    expect(dimmed).not.toBeNull();
    expect(dimmed).not.toContainElement(zoom);
    expect(zoom.closest('.opacity-60, .grayscale')).toBeNull();
  });

  it('morto mostra a linha fina com nome riscado e caveira', () => {
    withTurns([{ side: 'enemy', name: 'Orc', life: 'dead' }]);
    const li = screen.getByRole('listitem');
    expect(li.querySelector('s')).toHaveTextContent('Orc');
    expect(li).toHaveTextContent(t.dead);
    expect(li.className).toContain('border-dashed');
  });

  it('turno de oculto: nenhuma linha atual e a mensagem do mestre', () => {
    withTurns([{ side: 'player', name: 'Arani', isMine: true }], true);
    expect(screen.getByText(t.gmTurn)).toHaveAttribute('role', 'status');
    expect(document.querySelector('[aria-current]')).toBeNull();
  });

  describe('linha própria', () => {
    const mineTurn = (extra = {}) => {
      withTurns([
        {
          side: 'player',
          name: 'Arani',
          isMine: true,
          isCurrent: true,
          initiative: 14,
          characterId: 'c1',
          ownerUsername: 'rebs',
          ...extra,
        },
        { side: 'enemy', name: 'Orc', initiative: 9, characterId: 'zzz' },
      ]);
      return within(screen.getAllByRole('listitem')[0]);
    };

    it('tem "Sua iniciativa", Condições e Ver ficha', () => {
      const row = mineTurn();
      expect(row.getByLabelText(t.yourInitiative)).toHaveValue(14);
      expect(row.getByRole('button', { name: /Arani/ })).toBeInTheDocument();
      expect(row.getByRole('link', { name: t.viewSheet })).toHaveAttribute(
        'href',
        '/system/DnD_5e/character/c1',
      );
    });

    it('sem characterId não há Ver ficha', () => {
      const row = mineTurn({ characterId: null });
      expect(row.queryByRole('link')).not.toBeInTheDocument();
    });

    it('mudar a iniciativa chama setMyInitiative ao sair do campo', async () => {
      const row = mineTurn();
      const input = row.getByLabelText(t.yourInitiative);
      await userEvent.clear(input);
      await userEvent.type(input, '17');
      expect(hook.setMyInitiative.mutate).not.toHaveBeenCalled();
      await userEvent.tab();
      expect(hook.setMyInitiative.mutate).toHaveBeenCalledWith({
        participantId: 'x0',
        initiative: 17,
      });
    });

    it('limpar o campo grava null, não 0', async () => {
      const row = mineTurn();
      await userEvent.clear(row.getByLabelText(t.yourInitiative));
      await userEvent.tab();
      expect(hook.setMyInitiative.mutate).toHaveBeenCalledWith({
        participantId: 'x0',
        initiative: null,
      });
    });

    it('"Encerrar meu turno" fica dentro da própria linha, só na vez dele', async () => {
      const row = mineTurn();
      await userEvent.click(row.getByRole('button', { name: t.endMyTurn }));
      expect(hook.endTurn.mutate).toHaveBeenCalledWith('x0');
      expect(screen.getAllByRole('button', { name: t.endMyTurn })).toHaveLength(1);
    });

    it('fora da vez dele não há "Encerrar meu turno"', () => {
      const row = mineTurn({ isCurrent: false });
      expect(row.queryByRole('button', { name: t.endMyTurn })).not.toBeInTheDocument();
    });

    it('outras linhas não têm campo, link nem iniciativa', () => {
      mineTurn();
      const other = within(screen.getAllByRole('listitem')[1]);
      expect(other.queryByRole('spinbutton')).not.toBeInTheDocument();
      expect(other.queryByRole('link')).not.toBeInTheDocument();
      expect(other.queryByText('9')).not.toBeInTheDocument();
    });

    it('mostra o @ do dono; sem @ mostra "Jogador"', () => {
      const row = mineTurn();
      expect(row.getByText('@rebs')).toBeInTheDocument();
      expect(row.queryByText(t.player)).not.toBeInTheDocument();
    });

    it('sem dono escolhido mostra "Jogador"', () => {
      const row = mineTurn({ ownerUsername: null });
      expect(row.getByText(t.player)).toBeInTheDocument();
    });
  });
});

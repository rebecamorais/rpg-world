import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { encounterQueryKey } from '@frontend/lib/query-keys';

import type { OwnVitals, PlayerEncounterView } from '@backend/contexts/combat/domain/Encounter';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { PlayerCombatPanel, nextOwnTurn } from './PlayerCombatPanel';

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

// The player's own sheet, behind "Adjust HP": saved like the sheet saves it
const sheet = {
  character: {
    ...createDnD5eCharacter('o', 'Arani'),
    id: 'c1',
    hpCurrent: 12,
    hpMax: 20,
    hpTemp: 3,
  } as DnD5eCharacter,
  isLoading: false,
  error: null,
  isSaving: false,
  updateCharacter: vi.fn().mockResolvedValue(undefined),
};
vi.mock('@frontend/hooks/useCharacter', () => ({ useCharacter: () => sheet }));
vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: [PRONE],
    byKey: new Map([[PRONE.key, PRONE]]),
    isLoading: false,
  }),
}));

const t = messages.combat;
const endTurnOf = (name: string) => t.endTurnOf.replace('{name}', name);

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
      vitals: null,
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
      vitals: null,
    },
  ],
});

describe('PlayerCombatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.encounter = null;
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

  it('"Encerrar turno de …" só aparece na vez dele, na barra, e encerra o turno daquele participante', async () => {
    hook.encounter = view('theirs');
    const { unmount } = renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(screen.queryByRole('button', { name: endTurnOf('Arani') })).not.toBeInTheDocument();
    unmount();

    hook.encounter = view('mine');
    renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
    expect(screen.getByText(t.yourTurn)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: endTurnOf('Arani') }));
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
      expect(
        row.getByRole('button', { name: t.conditionsOf.replace('{name}', 'Arani') }),
      ).toBeInTheDocument();
      // The whole sheet opens over the combat, read-only, with "Edit sheet" inside
      expect(
        row.getByRole('button', { name: `${messages.sheetViewer.open} Arani` }),
      ).toBeInTheDocument();
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

    it('na vez dele, "Encerrar turno de …" fica na barra de turno, uma vez só', async () => {
      mineTurn();
      await userEvent.click(screen.getByRole('button', { name: endTurnOf('Arani') }));
      expect(hook.endTurn.mutate).toHaveBeenCalledWith('x0');
      expect(screen.getAllByRole('button', { name: endTurnOf('Arani') })).toHaveLength(1);
    });

    it('fora da vez dele não há "Encerrar turno"', () => {
      mineTurn({ isCurrent: false });
      expect(screen.queryByRole('button', { name: endTurnOf('Arani') })).not.toBeInTheDocument();
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

describe('PlayerCombatPanel: PV dos próprios personagens', () => {
  const vitals: OwnVitals = { hp: { current: 12, max: 20, temp: 3 }, ac: 15, speed: 9 };
  const statsT = messages.combatStats;
  const adjustOf = (name: string) => `${statsT.adjustHp} ${name}`;

  const render = (current: 'mine' | 'theirs' | 'next', extra: { vitals?: OwnVitals } = {}) => {
    const base = view(current === 'next' ? 'theirs' : current);
    const [mine, enemy] = base.turns;
    hook.encounter = {
      ...base,
      turns: [
        { ...mine, characterId: 'c1', vitals, ...extra },
        // Someone else's row: even if numbers came along, they are never shown
        { ...enemy, vitals: { hp: { current: 4, max: 7, temp: 0 }, ac: 13, speed: 6 } },
      ],
    };
    return renderWithProviders(<PlayerCombatPanel partyId="p" edition="2024" live />);
  };
  const rows = () => within(screen.getByRole('list', { name: t.order })).getAllByRole('listitem');

  beforeEach(() => {
    vi.clearAllMocks();
    sheet.updateCharacter.mockResolvedValue(undefined);
  });

  it('fora da vez: PV atual / máximo e temporário na própria linha, com "Ajustar PV"', () => {
    render('theirs');
    const [mine, enemy] = rows();
    expect(mine).toHaveTextContent(`${t.hp} 12 / 20 +3 ${t.tempHp}`);
    expect(within(mine).getByRole('button', { name: adjustOf('Arani') })).toBeInTheDocument();
    // Not the card: no AC or speed outside their turn
    expect(within(mine).queryByText(statsT.armorClass)).not.toBeInTheDocument();
    // The other row shows no number at all ("Goblin 1" carries its own digit)
    expect(enemy.textContent!.replace('Goblin 1', '')).not.toMatch(/\d/);
    expect(within(enemy).queryByRole('button', { name: /HP/ })).not.toBeInTheDocument();
  });

  it('PV de outra linha nunca aparece, mesmo se a visão trouxesse', () => {
    render('theirs');
    expect(screen.queryByText(/4 \/ 7/)).not.toBeInTheDocument();
    expect(screen.queryByText('13')).not.toBeInTheDocument();
  });

  it('na vez dele, a linha vira o cartão "Sua vez" com PV, CA, deslocamento e "Ajustar PV"', () => {
    render('mine');
    const card = rows()[0];
    expect(card).toHaveAttribute('aria-current', 'true');
    expect(within(card).getByText(t.yourTurn)).toBeInTheDocument();
    expect(card).toHaveTextContent(`${t.hp} 12 / 20 +3`);
    expect(within(card).getByText(statsT.armorClass).parentElement).toHaveTextContent('15');
    expect(within(card).getByText(statsT.speed).parentElement).toHaveTextContent(
      `9${statsT.speedUnit}`,
    );
    // The card's button is 44px tall (touch target on phones)
    expect(within(card).getByRole('button', { name: adjustOf('Arani') })).toHaveClass('h-11');
    expect(
      within(card).getByRole('button', { name: t.conditionsOf.replace('{name}', 'Arani') }),
    ).toBeInTheDocument();
  });

  it('a barra de turno mostra o PV ao lado de "Encerrar turno"', () => {
    render('mine');
    const bar = screen
      .getByRole('button', { name: endTurnOf('Arani') })
      .closest('[data-turn-bar]') as HTMLElement;
    expect(bar).toHaveTextContent(`${t.hp} 12 / 20 +3`);
  });

  it('esperando a vez, a barra mostra o PV do próximo personagem dele', () => {
    render('next');
    const bar = document.querySelector('[data-turn-bar]') as HTMLElement;
    expect(bar).toHaveTextContent('Arani');
    expect(bar).toHaveTextContent(`${t.hp} 12 / 20 +3`);
  });

  it('sem os números da ficha não há PV nem cartão, só a linha de sempre', () => {
    render('mine', { vitals: null as unknown as OwnVitals });
    const mine = rows()[0];
    expect(mine).not.toHaveTextContent('12 / 20');
    expect(within(mine).queryByRole('button', { name: adjustOf('Arani') })).toBeNull();
    expect(within(mine).queryByText(statsT.armorClass)).not.toBeInTheDocument();
  });

  it('"Ajustar PV" salva na ficha, como a ficha faz, e recarrega o combate', async () => {
    const { queryClient } = render('mine');
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries');

    await userEvent.click(screen.getByRole('button', { name: adjustOf('Arani') }));
    const dialog = screen.getByRole('dialog', { name: statsT.adjustHp });
    await userEvent.type(within(dialog).getByLabelText(statsT.adjustHpAmount), '5');
    await userEvent.click(within(dialog).getByRole('button', { name: statsT.damage }));

    // The temporary HP take the damage first
    expect(sheet.updateCharacter).toHaveBeenCalledWith(
      expect.objectContaining({ changes: { hpCurrent: 10, hpTemp: 0 } }),
    );
    expect(invalidate).toHaveBeenCalledWith({ queryKey: encounterQueryKey('p') });
  });
});

describe('nextOwnTurn', () => {
  const turn = (participantId: string, isMine: boolean, isCurrent = false, life = 'normal') =>
    ({ participantId, name: participantId, isMine, isCurrent, life }) as Parameters<
      typeof nextOwnTurn
    >[0][number];

  it('conta quantos turnos faltam até o próximo personagem dele, dando a volta na lista', () => {
    expect(nextOwnTurn([turn('a', true), turn('b', false, true), turn('c', false)])).toEqual({
      name: 'a',
      count: 2,
      hp: null,
    });
  });

  it('pula os mortos; na vez dele, ou sem vez visível, não conta nada', () => {
    expect(
      nextOwnTurn([turn('a', true, false, 'dead'), turn('b', false, true), turn('c', true)]),
    ).toEqual({ name: 'c', count: 1, hp: null });
    expect(nextOwnTurn([turn('a', true, true), turn('b', false)])).toBeNull();
    expect(nextOwnTurn([turn('a', true), turn('b', false)])).toBeNull();
  });
});

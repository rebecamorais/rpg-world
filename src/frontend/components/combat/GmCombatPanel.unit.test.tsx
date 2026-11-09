import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GmEncounterView } from '@backend/contexts/combat/domain/Encounter';
import type { PartyView } from '@backend/contexts/parties/domain/PartyView';

import { GmCombatPanel } from './GmCombatPanel';
import { gmRow } from './fixtures';

const mutation = () => ({ mutate: vi.fn(), isPending: false });
const hook = {
  encounter: null as GmEncounterView | null,
  isLoading: false,
  create: mutation(),
  finish: mutation(),
  start: mutation(),
  addParticipant: mutation(),
  updateParticipant: mutation(),
  removeParticipant: mutation(),
  setOrder: mutation(),
  endTurn: mutation(),
  setConditions: mutation(),
};

vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => hook }));
vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({ list: [], byKey: new Map(), isLoading: false }),
}));
vi.mock('@frontend/hooks/useCharacters', () => ({
  useCharacters: () => ({ characters: [{ id: 'goblin', name: 'Goblin' }] }),
}));

const t = messages.combat;
const party = {
  id: 'party-1',
  edition: '2024',
  roster: [
    { characterId: 'hero', name: 'Arani' },
    { characterId: 'friend', name: 'Brom' },
    { characterId: 'newbie', name: 'Cael' },
  ],
} as unknown as PartyView;

const running = (round: number): GmEncounterView => ({
  role: 'gm',
  round,
  rows: [
    gmRow({ participantId: 'a', initiative: 8 }),
    gmRow({
      participantId: 'b',
      characterId: 'goblin',
      side: 'enemy',
      name: 'Goblin',
      initiative: 17,
    }),
    gmRow({ participantId: 'c', characterId: 'friend', name: 'Brom', initiative: null }),
  ],
});

describe('GmCombatPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    hook.encounter = null;
  });

  it('sem combate: "Preparar combate" cria um', async () => {
    renderWithProviders(<GmCombatPanel party={party} live />);

    await userEvent.click(screen.getByRole('button', { name: t.prepare }));

    expect(hook.create.mutate).toHaveBeenCalled();
  });

  it('com o combate andando, só quem não está na vez esmaece; preparando, ninguém', () => {
    hook.encounter = running(0);
    const { unmount } = renderWithProviders(<GmCombatPanel party={party} live />);
    for (const card of screen.getAllByRole('listitem')) {
      expect(card).not.toHaveClass('grayscale-[.7]');
    }
    unmount();

    hook.encounter = running(1);
    hook.encounter.rows[1].isCurrent = true;
    renderWithProviders(<GmCombatPanel party={party} live />);
    const [arani, goblin, brom] = screen.getAllByRole('listitem');
    expect(arani).toHaveClass('grayscale-[.7]');
    expect(goblin).not.toHaveClass('grayscale-[.7]');
    expect(brom).toHaveClass('grayscale-[.7]');
  });

  it('a ordenação salva a ordem do sortByInitiative', async () => {
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);

    await userEvent.click(screen.getByRole('button', { name: t.sortByInitiative }));

    expect(hook.setOrder.mutate).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('"Começar" só na rodada 0; depois, "Encerrar turno" encerra o do atual', async () => {
    hook.encounter = running(0);
    const { unmount } = renderWithProviders(<GmCombatPanel party={party} live />);
    await userEvent.click(screen.getByRole('button', { name: t.start }));
    expect(hook.start.mutate).toHaveBeenCalled();
    unmount();

    hook.encounter = running(2);
    hook.encounter.rows[1].isCurrent = true;
    renderWithProviders(<GmCombatPanel party={party} live />);
    expect(screen.queryByRole('button', { name: t.start })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: t.endTurn }));
    expect(hook.endTurn.mutate).toHaveBeenCalledWith('b');
  });

  it('"Adicionar personagens da mesa" adiciona só os que ainda não estão', async () => {
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);

    await userEvent.click(screen.getByRole('button', { name: t.addPartyCharacters }));

    expect(hook.addParticipant.mutate).toHaveBeenCalledTimes(1);
    expect(hook.addParticipant.mutate).toHaveBeenCalledWith({ characterId: 'newbie' });
  });

  it('com todos da mesa no combate, "Adicionar personagens da mesa" some', () => {
    hook.encounter = running(0);
    renderWithProviders(
      <GmCombatPanel party={{ ...party, roster: party.roster.slice(0, 2) }} live />,
    );

    expect(screen.queryByRole('button', { name: t.addPartyCharacters })).not.toBeInTheDocument();
  });

  it('o NPC entra como inimigo por padrão; o mestre pode trocar para aliado', async () => {
    const user = userEvent.setup();
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);

    const enemy = screen.getByRole('button', { name: t.enemy });
    const ally = screen.getByRole('button', { name: t.ally });
    expect(enemy).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: t.addEnemy })).toBeInTheDocument();

    await user.click(ally);
    expect(ally).toHaveAttribute('aria-pressed', 'true');
    expect(enemy).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: t.addAlly })).toBeInTheDocument();
  });

  it('adicionar NPC oferece aliado, neutro e inimigo', async () => {
    const user = userEvent.setup();
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);

    for (const side of [t.ally, t.neutral, t.enemy]) {
      expect(screen.getByRole('button', { name: side })).toBeInTheDocument();
    }
    await user.click(screen.getByRole('button', { name: t.neutral }));
    expect(screen.getByRole('button', { name: t.addNeutral })).toBeInTheDocument();
  });

  it('o link para os NPCs leva à aba de NPCs', () => {
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);

    expect(screen.getByRole('link', { name: t.manageEnemySheets })).toHaveAttribute(
      'href',
      '/characters/npcs',
    );
  });

  it('encerrar o combate pede confirmação', async () => {
    hook.encounter = running(1);
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    renderWithProviders(<GmCombatPanel party={party} live />);
    const end = screen.getByRole('button', { name: t.endCombat });

    await userEvent.click(end);
    expect(hook.finish.mutate).not.toHaveBeenCalled();
    await userEvent.click(end);
    expect(hook.finish.mutate).toHaveBeenCalled();
    expect(confirm).toHaveBeenCalledWith(t.endCombatConfirm);
  });

  it('sem conexão em tempo real mostra "Reconectando…"', () => {
    hook.encounter = running(1);
    renderWithProviders(<GmCombatPanel party={party} live={false} />);

    expect(screen.getByRole('status')).toHaveTextContent(t.reconnecting);
  });
});

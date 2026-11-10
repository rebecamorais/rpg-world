import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
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
  previousTurn: mutation(),
  setConditions: mutation(),
};

vi.mock('sonner', () => ({ toast: vi.fn() }));
vi.mock('@frontend/hooks/useEncounter', () => ({ useEncounter: () => hook }));
vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({ list: [], byKey: new Map(), isLoading: false }),
}));
vi.mock('@frontend/hooks/useCharacters', () => ({
  useCharacters: () => ({ characters: [{ id: 'goblin', name: 'Goblin' }] }),
}));

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);
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
      expect(card.querySelector('.bg-character')).not.toHaveClass('grayscale');
    }
    unmount();

    hook.encounter = running(1);
    hook.encounter.rows[1].isCurrent = true;
    renderWithProviders(<GmCombatPanel party={party} live />);
    const [arani, goblin, brom] = screen.getAllByRole('listitem');
    expect(arani.querySelector('.bg-character')).toHaveClass('grayscale');
    expect(goblin.querySelector('.bg-character')).not.toHaveClass('grayscale');
    expect(brom.querySelector('.bg-character')).toHaveClass('grayscale');
  });

  it('a ordenação salva a ordem do sortByInitiative', async () => {
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);

    await userEvent.click(screen.getByRole('button', { name: new RegExp(t.sortByInitiative) }));

    expect(hook.setOrder.mutate).toHaveBeenCalledWith(['b', 'a', 'c']);
  });

  it('"Ordenar por iniciativa" mostra "ordem mudou" quando a lista está fora de ordem', () => {
    hook.encounter = running(0);
    const { unmount } = renderWithProviders(<GmCombatPanel party={party} live />);
    expect(screen.getByRole('button', { name: new RegExp(t.sortByInitiative) })).toHaveTextContent(
      t.orderChanged,
    );
    unmount();

    hook.encounter = running(0);
    const [a, b, c] = hook.encounter.rows;
    hook.encounter.rows = [b, a, c];
    renderWithProviders(<GmCombatPanel party={party} live />);
    expect(screen.getByRole('button', { name: t.sortByInitiative })).not.toHaveTextContent(
      t.orderChanged,
    );
  });

  it('não existe mais subir nem descer', () => {
    hook.encounter = running(0);
    renderWithProviders(<GmCombatPanel party={party} live />);
    expect(screen.queryByRole('button', { name: /^(Move|Subir|Descer)/ })).toBeNull();
  });

  it('"Trocar com" só aparece com vizinho de mesma iniciativa e grava a troca', async () => {
    hook.encounter = running(0);
    hook.encounter.rows[2].initiative = 17;
    hook.encounter.rows[1].isCurrent = true;
    renderWithProviders(<GmCombatPanel party={party} live />);

    // Goblin (17, open: its turn) ties with Brom (17) below; Arani (8) ties with no one
    await userEvent.click(screen.getByRole('button', { name: fill(t.swapWith, { name: 'Brom' }) }));
    expect(hook.setOrder.mutate).toHaveBeenCalledWith(['a', 'c', 'b']);
    expect(screen.queryByRole('button', { name: fill(t.swapWith, { name: 'Arani' }) })).toBeNull();
  });

  describe('Voltar turno', () => {
    it('não aparece preparando o combate', () => {
      hook.encounter = running(0);
      renderWithProviders(<GmCombatPanel party={party} live />);
      expect(screen.queryByRole('button', { name: t.previousTurn })).toBeNull();
    });

    it('Voltar turno chama previousTurn e avisa de quem é a vez', async () => {
      hook.encounter = running(2);
      hook.encounter.rows[1].isCurrent = true;
      hook.previousTurn.mutate.mockImplementation(
        (_: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.(),
      );
      renderWithProviders(<GmCombatPanel party={party} live />);

      await userEvent.click(screen.getByRole('button', { name: t.previousTurn }));
      expect(hook.previousTurn.mutate).toHaveBeenCalled();
      expect(toast).toHaveBeenCalledWith(fill(t.turnBackTo, { name: 'Arani' }));
    });

    it('voltando do primeiro, a vez vai para o último jogável', async () => {
      hook.encounter = running(2);
      hook.encounter.rows[0].isCurrent = true;
      hook.encounter.rows.push(
        gmRow({
          participantId: 'd',
          characterId: 'goblin',
          side: 'enemy',
          name: 'Goblin morto',
          hp: { current: 0, max: 7, temp: 0 },
          fate: 'dead',
          deathRevealed: true,
        }),
      );
      hook.previousTurn.mutate.mockImplementation(
        (_: unknown, options?: { onSuccess?: () => void }) => options?.onSuccess?.(),
      );
      renderWithProviders(<GmCombatPanel party={party} live />);

      await userEvent.click(screen.getByRole('button', { name: t.previousTurn }));
      expect(toast).toHaveBeenCalledWith(fill(t.turnBackTo, { name: 'Brom' }));
    });

    it('fica desabilitado na rodada 1 com a vez no primeiro jogável', () => {
      hook.encounter = running(1);
      hook.encounter.rows.unshift(
        gmRow({
          participantId: 'z',
          characterId: 'goblin',
          side: 'enemy',
          name: 'Goblin morto',
          hp: { current: 0, max: 7, temp: 0 },
          fate: 'dead',
          deathRevealed: true,
        }),
      );
      hook.encounter.rows[1].isCurrent = true;
      const { unmount } = renderWithProviders(<GmCombatPanel party={party} live />);
      expect(screen.getByRole('button', { name: t.previousTurn })).toBeDisabled();
      unmount();

      hook.encounter.rows[1].isCurrent = false;
      hook.encounter.rows[2].isCurrent = true;
      renderWithProviders(<GmCombatPanel party={party} live />);
      expect(screen.getByRole('button', { name: t.previousTurn })).toBeEnabled();
    });
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

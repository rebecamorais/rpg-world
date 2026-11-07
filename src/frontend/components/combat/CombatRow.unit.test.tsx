import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CombatRow } from './CombatRow';
import { gmRow } from './fixtures';

const CONDITIONS = [
  {
    key: 'dnd5e:srd-5.2:condition:prone',
    id: 'prone',
    edition: '2024',
    name: 'Caído',
    description: 'Caído.',
    maxLevel: null,
  },
];
vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: CONDITIONS,
    byKey: new Map(CONDITIONS.map((x) => [x.key, x])),
    isLoading: false,
  }),
}));

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const onConditions = vi.fn();
const rowElement = (row = gmRow(), waiting = false) => (
  <ul>
    <CombatRow
      partyId="party-1"
      row={row}
      isFirst={false}
      isLast={false}
      waiting={waiting}
      onChange={vi.fn()}
      onMove={vi.fn()}
      onRemove={vi.fn()}
      edition="2024"
      onConditionsChange={onConditions}
    />
  </ul>
);
const renderRow = (row = gmRow(), waiting = false) => renderWithProviders(rowElement(row, waiting));
const details = (name = 'Arani') =>
  screen.getByRole('button', { name: fill(t.detailsOf, { name }) });

describe('CombatRow', () => {
  it('fechado mostra quem é e o PV; aberto, CA, percepção, deslocamento e modificadores', async () => {
    renderRow();
    expect(screen.getByText(/Elfa · Maga/)).toBeInTheDocument();
    expect(screen.getByText('12 / 20')).toBeInTheDocument();

    await userEvent.click(details());
    expect(screen.getByText(messages.combatStats.armorClass)).toBeVisible();
    expect(screen.getByText(t.passivePerception)).toBeVisible();
    expect(screen.getByText(messages.combatStats.speed)).toBeVisible();
    // INT 18 → +4, STR 8 → -1
    expect(screen.getByText('+4')).toBeVisible();
    expect(screen.getByText('-1')).toBeVisible();
  });

  it('a linha da vez atual brilha', () => {
    renderRow(gmRow({ isCurrent: true }));
    expect(screen.getByRole('listitem')).toHaveClass('animate-turn-glow');
  });

  it('o jogador não tem campo de PV; o inimigo tem PV e temporário editáveis', async () => {
    renderRow();
    expect(screen.queryByLabelText(fill(t.hpOf, { name: 'Arani' }))).not.toBeInTheDocument();
    expect(screen.getByText('12 / 20')).toBeInTheDocument();

    renderRow(
      gmRow({
        participantId: 'p-g',
        side: 'enemy',
        name: 'Goblin 1',
        hp: { current: 5, max: 7, temp: 1 },
      }),
    );
    expect(screen.getByLabelText(fill(t.hpOf, { name: 'Goblin 1' }))).toHaveValue(5);
    await userEvent.click(details('Goblin 1'));
    expect(screen.getByLabelText(fill(t.tempHpOf, { name: 'Goblin 1' }))).toHaveValue(1);
  });

  it('o NPC aliado tem PV editável como o inimigo e aparece marcado como aliado', () => {
    renderRow(
      gmRow({
        participantId: 'p-a',
        side: 'ally',
        name: 'Guarda',
        hp: { current: 9, max: 11, temp: 0 },
      }),
    );
    expect(screen.getByLabelText(fill(t.hpOf, { name: 'Guarda' }))).toHaveValue(9);
    expect(screen.getAllByText(t.ally).length).toBeGreaterThan(0);
    expect(screen.queryByText(t.enemy)).not.toBeInTheDocument();
  });

  it('o PV temporário tem rótulo visível e a iniciativa vazia mostra um traço', async () => {
    renderRow(
      gmRow({
        participantId: 'p-g',
        side: 'enemy',
        name: 'Goblin 1',
        initiative: null,
        hp: { current: 5, max: 7, temp: 0 },
      }),
    );

    await userEvent.click(details('Goblin 1'));
    expect(screen.getByText(t.tempHp)).toBeVisible();
    expect(screen.getByLabelText(fill(t.initiativeOf, { name: 'Goblin 1' }))).toHaveAttribute(
      'placeholder',
      '—',
    );
  });

  it('com PV 0 o jogador mostra os testes contra a morte', () => {
    renderRow(
      gmRow({ hp: { current: 0, max: 20, temp: 0 }, deathSaves: { successes: 2, failures: 1 } }),
    );

    expect(screen.getByText(fill(t.deathSaves, { successes: 2, failures: 1 }))).toBeInTheDocument();
  });

  it('o nome abre a ficha certa: a da mesa para jogador, a normal para inimigo', () => {
    renderRow();
    expect(screen.getByRole('link', { name: /^Arani/ })).toHaveAttribute(
      'href',
      '/parties/party-1/characters/hero',
    );

    renderRow(
      gmRow({ participantId: 'p-g', characterId: 'goblin', side: 'enemy', name: 'Goblin' }),
    );
    expect(screen.getByRole('link', { name: /^Goblin/ })).toHaveAttribute(
      'href',
      '/system/DnD_5e/character/goblin',
    );
  });

  it('fechado mostra só iniciativa, nome e PV; abre pelo botão ou por um clique no card', async () => {
    renderRow();
    expect(details()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(messages.combatStats.armorClass)).not.toBeVisible();

    await userEvent.click(details());
    expect(details()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(messages.combatStats.armorClass)).toBeVisible();

    await userEvent.click(screen.getByText('12 / 20'));
    expect(details()).toHaveAttribute('aria-expanded', 'false');
  });

  it('só o nome leva à ficha; o avatar e a linha de raça e classe abrem o card', async () => {
    renderRow();
    expect(screen.getByRole('link', { name: 'Arani' })).toHaveTextContent(/^Arani$/);

    await userEvent.click(screen.getByText(/Elfa · Maga/));
    expect(details()).toHaveAttribute('aria-expanded', 'true');
  });

  it('o card usa a cor que o dono escolheu para o personagem', () => {
    renderRow(gmRow({ accentColor: '#16a34a' }));
    expect(screen.getByRole('listitem').style.getPropertyValue('--character-color')).toBe(
      '#16a34a',
    );
  });

  it('clicar no nome ou num campo não abre o card', async () => {
    renderRow();
    await userEvent.click(screen.getByLabelText(fill(t.initiativeOf, { name: 'Arani' })));
    expect(details()).toHaveAttribute('aria-expanded', 'false');
  });

  it('abre na vez do personagem e volta a fechar quando a vez passa', async () => {
    const { rerender } = renderRow(gmRow({ isCurrent: true }));
    expect(details()).toHaveAttribute('aria-expanded', 'true');

    // The GM's choice is dropped once the turn moves on
    await userEvent.click(details());
    rerender(rowElement(gmRow({ isCurrent: false })));
    expect(details()).toHaveAttribute('aria-expanded', 'false');
    rerender(rowElement(gmRow({ isCurrent: true })));
    expect(details()).toHaveAttribute('aria-expanded', 'true');
  });

  it('não mostra magia', () => {
    renderRow();
    expect(screen.queryByText(/4\/4|3\/4/)).not.toBeInTheDocument();
  });

  it('esperando a vez, o card fica esmaecido até ser aberto', async () => {
    renderRow(gmRow(), true);
    expect(screen.getByRole('listitem')).toHaveClass('grayscale-[.7]');

    await userEvent.click(details());
    expect(screen.getByRole('listitem')).not.toHaveClass('grayscale-[.7]');
  });

  it('fora do combate em andamento, o card não esmaece', () => {
    renderRow(gmRow(), false);
    expect(screen.getByRole('listitem')).not.toHaveClass('grayscale-[.7]');
  });

  it('sem foto, o retrato mostra o emblema da classe, escondido do leitor de tela', () => {
    const { container } = renderRow();
    // Maga → wizard
    expect(container.querySelector('[data-class]')).toHaveAttribute('data-class', 'wizard');
    expect(container.querySelector('[data-class]')!.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('a vez atual fica marcada com aria-current', () => {
    renderRow(gmRow({ isCurrent: true }));
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
  });

  it('mostra os selos das condições e o botão abre o seletor', async () => {
    renderRow(gmRow({ conditions: [{ key: 'dnd5e:srd-5.2:condition:prone', level: null }] }));
    expect(screen.getByRole('button', { name: 'Caído, condition' })).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole('button', { name: fill(t.conditionsOf, { name: 'Arani' }) }),
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: 'Caído' })).toBeChecked();
  });

  it('clicar dentro do seletor não abre o card', async () => {
    renderRow();
    await userEvent.click(
      screen.getByRole('button', { name: fill(t.conditionsOf, { name: 'Arani' }) }),
    );
    await userEvent.click(screen.getByRole('switch', { name: 'Caído' }));
    expect(onConditions).toHaveBeenCalledWith([
      { key: 'dnd5e:srd-5.2:condition:prone', level: null },
    ]);
    // The modal hides the card from the accessibility tree while it is open
    expect(
      screen.getByRole('button', { name: fill(t.detailsOf, { name: 'Arani' }), hidden: true }),
    ).toHaveAttribute('aria-expanded', 'false');
  });

  describe('ampliar a imagem', () => {
    const view = { name: messages.avatarUpload.viewOf.replace('{name}', 'Arani') };

    it('abre o modal sem abrir os detalhes da linha', async () => {
      renderRow(gmRow({ avatarUrl: 'https://img.test/a.webp' }));

      await userEvent.click(screen.getByRole('button', view));
      expect(screen.getByRole('img', { name: 'Arani' })).toBeInTheDocument();

      await userEvent.keyboard('{Escape}');
      expect(details()).toHaveAttribute('aria-expanded', 'false');
    });

    it('sem imagem não mostra o botão', () => {
      renderRow();

      expect(screen.queryByRole('button', view)).not.toBeInTheDocument();
    });
  });

  describe('controles do mestre sobre NPCs', () => {
    const goblin = (overrides = {}) =>
      gmRow({
        participantId: 'p-g',
        characterId: 'goblin',
        side: 'enemy',
        name: 'Goblin',
        ...overrides,
      });
    const renderWith = (row: ReturnType<typeof gmRow>, onChange = vi.fn()) => {
      renderWithProviders(
        <ul>
          <CombatRow
            partyId="party-1"
            row={row}
            isFirst={false}
            isLast={false}
            onChange={onChange}
            onMove={vi.fn()}
            onRemove={vi.fn()}
            edition="2024"
            onConditionsChange={vi.fn()}
          />
        </ul>,
      );
      return onChange;
    };

    it('mostra o lado também no turno do NPC, junto de "Vez atual"', () => {
      renderWith(goblin({ isCurrent: true }));
      expect(screen.getByText(t.currentTurn)).toBeInTheDocument();
      expect(screen.getAllByText(t.enemy).length).toBeGreaterThan(0);
    });

    it('o jogador também mostra o lado', () => {
      renderRow(gmRow({ isCurrent: true }));
      expect(screen.getByText(t.player)).toBeInTheDocument();
      expect(screen.getByText(t.currentTurn)).toBeInTheDocument();
    });

    it('NPC mostra o estado de visibilidade e três ações com rótulo', () => {
      renderWith(goblin({ visibility: 'anonymous' }));
      const group = screen.getByRole('group', { name: 'Goblin' });
      expect(group).toBeInTheDocument();
      expect(screen.getByText(t.visibilityAnonymous)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: t.anonymize })).toHaveAttribute(
        'aria-pressed',
        'true',
      );
      expect(screen.getByRole('button', { name: t.show })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: t.hide })).toHaveAttribute('aria-pressed', 'false');
    });

    it('clicar em Anonimizar chama onChange({ visibility: "anonymous" })', async () => {
      const onChange = renderWith(goblin());
      await userEvent.click(screen.getByRole('button', { name: t.anonymize }));
      expect(onChange).toHaveBeenCalledWith({ visibility: 'anonymous' });
    });

    it('a ação mostra um tooltip com o mesmo texto, também ao tocar', async () => {
      renderWith(goblin());
      await userEvent.click(screen.getByRole('button', { name: t.hide }));
      expect(await screen.findByRole('tooltip')).toHaveTextContent(t.hide);
    });

    it('jogador não tem controles de visibilidade nem de lado', () => {
      renderRow();
      expect(screen.queryByRole('button', { name: t.hide })).not.toBeInTheDocument();
      expect(screen.queryByRole('group', { name: 'Arani' })).not.toBeInTheDocument();
      expect(
        screen.queryByRole('combobox', { name: fill(t.changeSideOf, { name: 'Arani' }) }),
      ).not.toBeInTheDocument();
    });

    it('trocar o lado chama onChange({ side: "neutral" })', async () => {
      const onChange = renderWith(goblin());
      await userEvent.click(
        screen.getByRole('combobox', { name: fill(t.changeSideOf, { name: 'Goblin' }) }),
      );
      await userEvent.click(await screen.findByRole('option', { name: t.neutral }));
      expect(onChange).toHaveBeenCalledWith({ side: 'neutral' });
    });
  });
});

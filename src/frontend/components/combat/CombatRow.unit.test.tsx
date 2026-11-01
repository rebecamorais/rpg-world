import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CombatRow } from './CombatRow';
import { gmRow } from './fixtures';

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

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
});

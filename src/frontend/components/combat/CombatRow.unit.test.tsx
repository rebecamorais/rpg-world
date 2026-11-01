import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CombatRow } from './CombatRow';
import { gmRow } from './fixtures';

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const rowElement = (row = gmRow()) => (
  <ul>
    <CombatRow
      partyId="party-1"
      row={row}
      isFirst={false}
      isLast={false}
      onChange={vi.fn()}
      onMove={vi.fn()}
      onRemove={vi.fn()}
    />
  </ul>
);
const renderRow = (row = gmRow()) => renderWithProviders(rowElement(row));
const details = (name = 'Arani') =>
  screen.getByRole('button', { name: fill(t.detailsOf, { name }) });

describe('CombatRow', () => {
  it.each([
    [{ current: 20, max: 20 }, 'healthy', '100%'],
    [{ current: 9, max: 20 }, 'wounded', '45%'],
    [{ current: 3, max: 20 }, 'critical', '15%'],
    [{ current: 0, max: 0 }, 'critical', '0%'],
  ])('a barra de PV %o fica %s', (hp, tone, width) => {
    const { container } = renderRow(gmRow({ hp: { ...hp, temp: 0 } }));
    const bar = container.querySelector('[data-hp-bar]')!;
    expect(bar).toHaveAttribute('data-tone', tone);
    expect(bar.firstElementChild).toHaveStyle({ width });
  });

  it('a linha da vez atual brilha', () => {
    renderRow(gmRow({ isCurrent: true }));
    expect(screen.getByRole('listitem')).toHaveClass('animate-turn-glow');
  });

  it('o jogador não tem campo de PV; o inimigo tem PV e temporário editáveis', async () => {
    renderRow();
    expect(screen.queryByLabelText(fill(t.hpOf, { name: 'Arani' }))).not.toBeInTheDocument();
    expect(screen.getByText('12/20')).toBeInTheDocument();

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
    expect(screen.getByRole('link', { name: 'Arani' })).toHaveAttribute(
      'href',
      '/parties/party-1/characters/hero',
    );

    renderRow(
      gmRow({ participantId: 'p-g', characterId: 'goblin', side: 'enemy', name: 'Goblin' }),
    );
    expect(screen.getByRole('link', { name: 'Goblin' })).toHaveAttribute(
      'href',
      '/system/DnD_5e/character/goblin',
    );
  });

  it('fechado mostra só iniciativa, nome e PV; abre pelo botão ou por um clique no card', async () => {
    renderRow();
    expect(details()).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(t.ac)).not.toBeVisible();

    await userEvent.click(details());
    expect(details()).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(t.ac)).toBeVisible();

    await userEvent.click(screen.getByText('12/20'));
    expect(details()).toHaveAttribute('aria-expanded', 'false');
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

  it('a vez atual fica marcada com aria-current', () => {
    renderRow(gmRow({ isCurrent: true }));
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
  });
});

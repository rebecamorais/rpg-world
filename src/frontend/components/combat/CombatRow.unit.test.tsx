import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CombatRow } from './CombatRow';
import { gmRow } from './fixtures';

const t = messages.combat;
const fill = (text: string, values: Record<string, string | number>) =>
  Object.entries(values).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), text);

const renderRow = (row = gmRow()) =>
  renderWithProviders(
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
    </ul>,
  );

describe('CombatRow', () => {
  it('o jogador não tem campo de PV; o inimigo tem PV e temporário editáveis', () => {
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
    expect(screen.getByLabelText(fill(t.tempHpOf, { name: 'Goblin 1' }))).toHaveValue(1);
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

  it('a vez atual fica marcada com aria-current', () => {
    renderRow(gmRow({ isCurrent: true }));
    expect(screen.getByRole('listitem')).toHaveAttribute('aria-current', 'true');
  });
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { Spell } from '@frontend/types/spells';

import { SpellCard } from './SpellCard';

const t = messages.characters;

const FIREBALL: Spell = {
  id: 'fireball',
  name: 'Fireball',
  level: 3,
  school: 'evocation',
  components: ['V', 'S', 'M'],
  castingTime: 'action',
  castingValue: 1,
};

describe('SpellCard na busca de magias', () => {
  it('aprende direto do card recolhido', async () => {
    const user = userEvent.setup();
    const onLearnSpell = vi.fn();
    renderWithProviders(
      <SpellCard spell={FIREBALL} onLearnSpell={onLearnSpell} onForgetSpell={vi.fn()} />,
    );

    expect(screen.queryByText(t.learnedBadge)).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.learnSpell }));

    expect(onLearnSpell).toHaveBeenCalledWith('fireball');
  });

  it('marca a magia aprendida e esquece pelo mesmo botão', async () => {
    const user = userEvent.setup();
    const onForgetSpell = vi.fn();
    renderWithProviders(
      <SpellCard spell={FIREBALL} isLearned onLearnSpell={vi.fn()} onForgetSpell={onForgetSpell} />,
    );

    expect(screen.getByText(t.learnedBadge)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.forgetSpell }));

    expect(onForgetSpell).toHaveBeenCalledWith('fireball');
  });

  it('expandir só mostra a magia, sem repetir a ação', () => {
    renderWithProviders(
      <SpellCard spell={FIREBALL} isExpanded onLearnSpell={vi.fn()} onForgetSpell={vi.fn()} />,
    );

    expect(screen.getAllByRole('button', { name: t.learnSpell })).toHaveLength(1);
  });

  it('mostra o nível quando pedido (a busca mistura níveis)', () => {
    const { rerender } = renderWithProviders(<SpellCard spell={FIREBALL} />);
    expect(screen.queryByText('Level 3')).not.toBeInTheDocument();

    rerender(<SpellCard spell={FIREBALL} showLevel />);
    expect(screen.getByText('Level 3')).toBeInTheDocument();
  });
});

describe('SpellCard: edição e idioma', () => {
  it('mostra a edição da magia', () => {
    renderWithProviders(<SpellCard spell={{ ...FIREBALL, edition: '2024' }} />);
    expect(screen.getByText(`${t.edition}:`, { exact: false }).parentElement).toHaveTextContent(
      '2024',
    );
  });

  it('avisa quando a descrição está em inglês', () => {
    renderWithProviders(
      <SpellCard spell={{ ...FIREBALL, description: 'Boom.', untranslated: true }} isExpanded />,
    );
    expect(screen.getByText(t.untranslatedBadge)).toBeInTheDocument();
  });

  it('sem aviso quando a descrição está no idioma', () => {
    renderWithProviders(
      <SpellCard spell={{ ...FIREBALL, description: 'Boom.', untranslated: false }} isExpanded />,
    );
    expect(screen.queryByText(t.untranslatedBadge)).not.toBeInTheDocument();
  });
});

describe('SpellCard: tempo de conjuração e melhorias', () => {
  it('reação mostra quando é usada', () => {
    renderWithProviders(
      <SpellCard
        spell={{
          ...FIREBALL,
          castingTime: 'reaction',
          description: 'Interrupt.',
          trigger: 'which you take when you see a creature casting a spell',
        }}
        isExpanded
      />,
    );
    expect(
      screen.getByText('which you take when you see a creature casting a spell', { exact: false }),
    ).toHaveTextContent('1 Reaction, which you take when you see a creature casting a spell');
  });

  it('mostra todos os tempos de conjuração', () => {
    renderWithProviders(
      <SpellCard
        spell={{ ...FIREBALL, extraCastingTimes: [{ castingTime: 'hour', castingValue: 8 }] }}
        isExpanded
      />,
    );
    expect(screen.getByText('1 Action or 8 Hours')).toBeInTheDocument();
  });

  it('no truque, a melhoria tem o nome de melhoria do truque', () => {
    renderWithProviders(
      <SpellCard
        spell={{ ...FIREBALL, level: 0, description: 'Zap.', higherLevel: 'More damage.' }}
        isExpanded
      />,
    );
    expect(screen.getByText(`${t.cantripUpgrade}:`)).toBeInTheDocument();
    expect(screen.queryByText(`${t.atHigherLevels}:`)).not.toBeInTheDocument();
  });
});

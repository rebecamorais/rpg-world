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
});

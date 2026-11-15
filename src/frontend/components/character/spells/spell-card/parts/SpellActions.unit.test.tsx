import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { Spell } from '@frontend/types/spells';

import type { SpellDisplayValues } from '../hooks/useSpellDisplay';
import { SpellActions } from './SpellActions';

const SPELL = { id: 'fireball', name: 'Fireball', level: 3 } as Spell;
const display = { forgetLabel: 'Forget spell' } as SpellDisplayValues;

describe('SpellActions', () => {
  it('esquece a magia', async () => {
    const user = userEvent.setup();
    const onForgetSpell = vi.fn();
    renderWithProviders(
      <SpellActions spell={SPELL} onForgetSpell={onForgetSpell} displayValues={display} />,
    );

    await user.click(screen.getByRole('button', { name: 'Forget spell' }));
    expect(onForgetSpell).toHaveBeenCalledWith('fireball');
  });

  it('enquanto salva, trava sem perder o foco', async () => {
    const user = userEvent.setup();
    const onForgetSpell = vi.fn();
    const { rerender } = renderWithProviders(
      <SpellActions spell={SPELL} onForgetSpell={onForgetSpell} displayValues={display} />,
    );
    const button = screen.getByRole('button', { name: 'Forget spell' });
    button.focus();

    rerender(
      <SpellActions spell={SPELL} onForgetSpell={onForgetSpell} pending displayValues={display} />,
    );

    // Still focusable: the keyboard user stays where they were
    expect(button).toHaveFocus();
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toHaveAttribute('aria-busy', 'true');
    await user.click(button);
    expect(onForgetSpell).not.toHaveBeenCalled();
  });
});

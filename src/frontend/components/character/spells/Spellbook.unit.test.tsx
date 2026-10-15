import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { Spell } from '@frontend/types/spells';

import { Spellbook } from './Spellbook';

const t = messages.characters;

function spell(id: string, name: string, level: number, isPrepared = false): Spell {
  return {
    id,
    name,
    level,
    school: 'evocation',
    components: ['V', 'S'],
    castingTime: 'action',
    castingValue: 1,
    isPrepared,
  };
}

const SPELLS = [
  spell('fireball', 'Fireball', 3),
  spell('light', 'Light', 0),
  spell('counterspell', 'Counterspell', 3),
  spell('fly', 'Fly', 3, true),
  spell('mage-hand', 'Mage Hand', 0),
];

/** Spell names in the order their cards are rendered. */
function renderedSpellNames() {
  return screen
    .getAllByRole('article')
    .map((card) => document.getElementById(card.getAttribute('aria-labelledby')!)!.textContent);
}

function card(name: string) {
  return screen.getByRole('article', { name: new RegExp(name) });
}

describe('Spellbook', () => {
  it('não renderiza nada sem magias', () => {
    const { container } = renderWithProviders(<Spellbook characterSpells={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  it('agrupa por nível, em ordem, com a contagem de cada um', () => {
    renderWithProviders(<Spellbook characterSpells={SPELLS} />);

    const tabs = screen.getAllByRole('tab');
    expect(tabs.map((tab) => tab.textContent)).toEqual(['Cantrips2', 'Level 33']);
    expect(screen.getByRole('heading', { name: t.cantrips })).toBeInTheDocument();
    expect(renderedSpellNames()).toEqual(['Light', 'Mage Hand']);
  });

  it('conta as magias do nível no singular e no plural', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Spellbook characterSpells={[...SPELLS, spell('wish', 'Wish', 9)]} />);

    expect(screen.getByText('2 spells')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: /Level 9/ }));
    expect(screen.getByText('1 spell')).toBeInTheDocument();
  });

  it('mostra as preparadas primeiro e o resto em ordem alfabética', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Spellbook characterSpells={SPELLS} />);

    await user.click(screen.getByRole('tab', { name: /Level 3/ }));

    expect(screen.getByRole('heading', { name: 'Level 3 Spells' })).toBeInTheDocument();
    expect(renderedSpellNames()).toEqual(['Fly', 'Counterspell', 'Fireball']);
  });

  it('prepara, desprepara e esquece magias', async () => {
    const user = userEvent.setup();
    const onTogglePrepared = vi.fn();
    const onForgetSpell = vi.fn();
    renderWithProviders(
      <Spellbook
        characterSpells={SPELLS}
        onTogglePrepared={onTogglePrepared}
        onForgetSpell={onForgetSpell}
      />,
    );
    await user.click(screen.getByRole('tab', { name: /Level 3/ }));

    await user.click(within(card('Fireball')).getByRole('button', { name: t.prepareSpell }));
    await user.click(within(card('Fly')).getByRole('button', { name: t.unprepareSpell }));
    await user.click(within(card('Counterspell')).getByRole('button', { name: t.forgetSpell }));

    expect(onTogglePrepared).toHaveBeenNthCalledWith(1, 'fireball', true);
    expect(onTogglePrepared).toHaveBeenNthCalledWith(2, 'fly', false);
    expect(onForgetSpell).toHaveBeenCalledWith('counterspell');
  });

  it('truques não podem ser preparados', () => {
    renderWithProviders(<Spellbook characterSpells={SPELLS} />);

    expect(
      within(card('Light')).queryByRole('button', { name: t.prepareSpell }),
    ).not.toBeInTheDocument();
  });

  it('expande uma magia por vez', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Spellbook characterSpells={SPELLS} />);

    const expandLight = within(card('Light')).getByRole('button', { name: /Expand Light/ });
    await user.click(expandLight);
    expect(expandLight).toHaveAttribute('aria-expanded', 'true');

    await user.click(within(card('Mage Hand')).getByRole('button', { name: /Expand Mage Hand/ }));
    expect(expandLight).toHaveAttribute('aria-expanded', 'false');
  });
});

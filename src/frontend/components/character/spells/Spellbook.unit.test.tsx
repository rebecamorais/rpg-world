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
  it('sem magias, convida a adicionar a primeira', async () => {
    const user = userEvent.setup();
    const onAddSpell = vi.fn();
    renderWithProviders(<Spellbook characterSpells={[]} onAddSpell={onAddSpell} />);

    expect(screen.getByText(messages.spellsDrawer.emptyState)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: t.spells.addBtn }));
    expect(onAddSpell).toHaveBeenCalled();
  });

  it('mostra todos os níveis numa lista só, em ordem, com atalhos no índice', () => {
    renderWithProviders(<Spellbook characterSpells={SPELLS} />);

    const index = screen.getByRole('navigation', { name: t.spellbookIndex });
    const links = within(index).getAllByRole('link');
    expect(links.map((link) => link.textContent)).toEqual(['Cantrips2', 'Level 33']);
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '#spell-level-0',
      '#spell-level-3',
    ]);
    expect(links[0]).toHaveAttribute('aria-current', 'location');

    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      t.cantrips,
      'Level 3 Spells',
    ]);
  });

  it('em cada nível, as preparadas primeiro e o resto em ordem alfabética', () => {
    renderWithProviders(<Spellbook characterSpells={SPELLS} />);

    expect(renderedSpellNames()).toEqual(['Light', 'Mage Hand', 'Fly', 'Counterspell', 'Fireball']);
  });

  it('conta as magias do nível no singular e no plural', () => {
    renderWithProviders(<Spellbook characterSpells={[...SPELLS, spell('wish', 'Wish', 9)]} />);

    const level9 = screen.getByRole('region', { name: 'Level 9 Spells' });
    expect(within(level9).getByText('1 spell')).toBeInTheDocument();
    const level3 = screen.getByRole('region', { name: 'Level 3 Spells' });
    expect(within(level3).getByText('3 spells')).toBeInTheDocument();
  });

  it('prepara e desprepara no card recolhido; esquece só com ele aberto', async () => {
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
    await user.click(within(card('Fireball')).getByRole('button', { name: t.prepareSpell }));
    await user.click(within(card('Fly')).getByRole('button', { name: t.unprepareSpell }));
    // jsdom ignores `inert` in role queries, so check the attribute on the hidden content.
    expect(
      within(card('Counterspell')).getByRole('button', { name: t.forgetSpell }).closest('[inert]'),
    ).not.toBeNull();
    await user.click(within(card('Counterspell')).getByRole('button', { name: /Expand/ }));
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

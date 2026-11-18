import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { existsSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';

import { DAMAGE_THEMES, SCHOOL_THEMES } from '@frontend/constants/damage-themes';
import { SPELL_CARD_BORDER, grimoireSwitchedOff } from '@frontend/constants/grimoire-effects';
import type { Spell } from '@frontend/types/spells';

import { SpellCard } from './SpellCard';
import { schoolEmblemOf, spellGrimoireOf } from './spell-grimoire';

vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({ list: [], byKey: new Map(), isLoading: false }),
}));

const t = messages.characters;

const FIREBALL: Spell = {
  id: 'fireball',
  name: 'Fireball',
  level: 3,
  school: 'evocation',
  damageType: 'fire',
  components: ['V', 'S', 'M'],
  castingTime: 'action',
  castingValue: 1,
};

const SHIELD: Spell = {
  id: 'shield',
  name: 'Shield',
  level: 1,
  school: 'abjuration',
  components: ['V', 'S'],
  castingTime: 'reaction',
  castingValue: 1,
};

describe('spellGrimoireOf', () => {
  it('o efeito segue o dano, senão a escola; o emblema é sempre o da escola', () => {
    expect(spellGrimoireOf(FIREBALL, true).effect?.id).toBe('flame-ribbons');
    expect(spellGrimoireOf(SHIELD, true).effect?.id).toBe('abjuration-aegis-ward');
    expect(spellGrimoireOf(FIREBALL, true).icon).toBe(schoolEmblemOf('evocation'));
    expect(spellGrimoireOf(SHIELD, true).icon).toBe(schoolEmblemOf('abjuration'));
  });

  it('todos os 13 danos e as 8 escolas têm efeito, e toda escola tem emblema', () => {
    expect(Object.keys(DAMAGE_THEMES)).toHaveLength(13);
    expect(Object.keys(SCHOOL_THEMES)).toHaveLength(8);
    // Without a school: the effect has to come from the damage type itself
    for (const damageType of Object.keys(DAMAGE_THEMES)) {
      expect(spellGrimoireOf({ damageType }, true).effect, damageType).toBeDefined();
    }
    for (const school of Object.keys(SCHOOL_THEMES)) {
      const { effect, icon } = spellGrimoireOf({ school }, true);
      expect(effect).toBeDefined();
      expect(icon).toBeDefined();
    }
  });

  it('a borda é o anel de luz no hover e o giro de luz ao abrir', () => {
    const { border } = spellGrimoireOf(SHIELD, true);
    expect(border).toMatchObject(SPELL_CARD_BORDER);
  });

  it('devolve os mesmos objetos a cada chamada, para o memo do SpellCard', () => {
    const a = spellGrimoireOf(FIREBALL, true);
    const b = spellGrimoireOf({ ...FIREBALL }, true);
    expect(b.effect).toBe(a.effect);
    expect(b.icon).toBe(a.icon);
    expect(b.border).toBe(a.border);
    // Other spells share the border and, by school, the emblem
    expect(spellGrimoireOf(SHIELD, true).border).toBe(a.border);
  });

  it('toda escola tem a imagem do emblema em public/grimoire/emblems', () => {
    for (const school of Object.keys(SCHOOL_THEMES)) {
      expect(existsSync(`public/grimoire/emblems/${school}.webp`), school).toBe(true);
    }
  });

  it('a chave desliga com off, false ou 0, sem diferenciar maiúsculas', () => {
    for (const value of ['off', 'OFF', ' Off ', 'false', '0']) {
      expect(grimoireSwitchedOff(value), value).toBe(true);
    }
    for (const value of [undefined, '', 'on', 'true', '1']) {
      expect(grimoireSwitchedOff(value), String(value)).toBe(false);
    }
  });

  it('escola desconhecida: sem emblema (fica o ícone do jogo)', () => {
    expect(spellGrimoireOf({ school: 'homebrew' }, true).icon).toBeUndefined();
  });

  it('desligado (rollback), não dá nada: o card fica o de hoje', () => {
    expect(spellGrimoireOf(FIREBALL, false)).toEqual({});
  });
});

describe('SpellCard com o Grimório', () => {
  it('fechado: o emblema da escola no cabeçalho, e o dano na linha de detalhes', () => {
    const { container } = renderWithProviders(
      <SpellCard spell={FIREBALL} {...spellGrimoireOf(FIREBALL, true)} />,
    );
    const card = container.querySelector('article')!;
    expect(card.querySelector('[data-school-emblem="evocation"]')).not.toBeNull();
    expect(card).toHaveAttribute('data-border-hover', 'glow');
    expect(card).not.toHaveAttribute('data-border-open');
    // The damage type keeps its own icon on the details line
    const damage = screen.getByText(
      (_, el) => el?.tagName === 'LI' && /Fire$/.test(el.textContent ?? ''),
    );
    expect(damage.querySelector('svg')).not.toBeNull();
  });

  it('aberto: o efeito do dano, o texto na caixa de leitura e a borda aberta', () => {
    const { container } = renderWithProviders(
      <SpellCard spell={FIREBALL} isExpanded {...spellGrimoireOf(FIREBALL, true)} />,
    );
    const card = container.querySelector('article')!;
    expect(card).toHaveAttribute('data-grimoire-host');
    expect(card).toHaveAttribute('data-border-open');
    expect(card.querySelector('[data-grimoire-backdrop]')).not.toBeNull();
  });

  it('fechar antes do quadro seguinte não monta o efeito', async () => {
    const props = spellGrimoireOf(FIREBALL, true);
    const { container, rerender } = renderWithProviders(
      <SpellCard spell={FIREBALL} isExpanded {...props} />,
    );
    rerender(<SpellCard spell={FIREBALL} {...props} />);
    // Past the two frames the effect would have waited for
    await act(() => new Promise((resolve) => setTimeout(resolve, 100)));
    expect(container.querySelector('[data-enter]')).toBeNull();
  });

  it('desligado, o card não ganha nada do Grimório', () => {
    const { container } = renderWithProviders(
      <SpellCard spell={FIREBALL} isExpanded {...spellGrimoireOf(FIREBALL, false)} />,
    );
    const card = container.querySelector('article')!;
    expect(card).not.toHaveAttribute('data-grimoire-host');
    expect(card).not.toHaveAttribute('data-border-hover');
    expect(card.querySelector('[data-school-emblem]')).toBeNull();
  });

  it('as ações continuam: preparar no card fechado', async () => {
    const user = userEvent.setup();
    const onTogglePrepared = vi.fn();
    renderWithProviders(
      <SpellCard
        spell={FIREBALL}
        onTogglePrepared={onTogglePrepared}
        {...spellGrimoireOf(FIREBALL, true)}
      />,
    );
    await user.click(screen.getByRole('button', { name: new RegExp(t.prepareSpell, 'i') }));
    expect(onTogglePrepared).toHaveBeenCalledWith('fireball', true);
  });
});

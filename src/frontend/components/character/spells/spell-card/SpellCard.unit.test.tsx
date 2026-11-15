import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { Spell } from '@frontend/types/spells';

import { SpellCard } from './SpellCard';

vi.mock('@frontend/hooks/useConditions', () => {
  const frightened = {
    key: 'dnd5e:srd-5.2:condition:frightened',
    id: 'frightened',
    edition: '2024',
    name: 'Frightened',
    description: 'Scared.',
    maxLevel: null,
  };
  return {
    useConditions: () => ({
      list: [frightened],
      byKey: new Map([[frightened.key, frightened]]),
      isLoading: false,
    }),
  };
});

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

  it('enquanto a magia salva, o botão dela trava; o de outra magia não', async () => {
    const onLearnSpell = vi.fn();
    const { queryClient } = renderWithProviders(
      <>
        <SpellCard
          spell={FIREBALL}
          characterId="c1"
          onLearnSpell={onLearnSpell}
          onForgetSpell={vi.fn()}
        />
        <SpellCard
          spell={{ ...FIREBALL, id: 'shield', name: 'Shield' }}
          characterId="c1"
          onLearnSpell={onLearnSpell}
          onForgetSpell={vi.fn()}
        />
        {/* Another character's Fireball */}
        <SpellCard
          spell={FIREBALL}
          characterId="c2"
          onLearnSpell={onLearnSpell}
          onForgetSpell={vi.fn()}
        />
      </>,
    );

    // A write to Fireball that hasn't answered yet, as useCharacterSpells makes it
    void queryClient
      .getMutationCache()
      .build(queryClient, {
        mutationKey: ['character-spells-write', 'c1'],
        mutationFn: () => new Promise(() => {}),
      })
      .execute({ id: 'fireball', action: 'learn' });

    const [fireball, shield, otherFireball] = screen.getAllByRole('button', {
      name: t.learnSpell,
    });
    await waitFor(() => expect(fireball).toBeDisabled());
    expect(fireball).toHaveAttribute('aria-busy', 'true');
    expect(shield).toBeEnabled();
    expect(otherFireball).toBeEnabled();
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

describe('SpellCard: condições', () => {
  it('mostra o selo de cada condição da magia', () => {
    renderWithProviders(
      <SpellCard
        spell={{
          ...FIREBALL,
          id: 'dnd5e:srd-5.2:spell:fear',
          description: 'Fica {@condition frightened}.',
          conditions: ['dnd5e:srd-5.2:condition:frightened'],
        }}
        isExpanded
      />,
    );
    // The badge and the tag in the text
    expect(screen.getAllByRole('button', { name: 'Frightened, condition' })).toHaveLength(2);
  });
});

describe('SpellCard com material (exploração do Grimoire)', () => {
  const material = {
    id: 'glacial-glass' as const,
    surface: <span data-testid="surface" />,
    ornament: <span data-testid="ornament" />,
  };

  it('sem material, continua como antes: recorta na borda e não ganha camadas novas', () => {
    const { container } = renderWithProviders(<SpellCard spell={FIREBALL} />);
    const card = container.querySelector('article')!;

    expect(card).toHaveClass('overflow-hidden');
    expect(card).not.toHaveClass('overflow-visible');
    expect(card.querySelector('[data-material-clip]')).toBeNull();
    expect(card.style.contentVisibility).toBe('auto');
  });

  it('com material, a borda externa deixa de recortar e o recorte passa para a camada interna', () => {
    const { container } = renderWithProviders(<SpellCard spell={FIREBALL} material={material} />);
    const card = container.querySelector('article')!;
    const clip = card.querySelector('[data-material-clip]')!;

    expect(card).toHaveClass('overflow-visible');
    expect(card).not.toHaveClass('overflow-hidden');
    expect(clip).toHaveClass('overflow-hidden');
    expect(clip).toContainElement(screen.getByTestId('surface'));
    // The ornament sits outside the clip, free to reach past the edge
    expect(clip).not.toContainElement(screen.getByTestId('ornament'));
    expect(card.style.contentVisibility).toBe('auto');
  });

  it('com material, o fundo do card aberto fica dentro do recorte e o card continua abrindo', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    const { container } = renderWithProviders(
      <SpellCard spell={FIREBALL} material={material} isExpanded onToggle={onToggle} />,
    );
    const clip = container.querySelector('[data-material-clip]')!;

    expect(clip.childElementCount).toBe(3); // surface, stripe, SpellVFX
    await user.click(screen.getByRole('button', { expanded: true }));
    expect(onToggle).toHaveBeenCalledWith('fireball');
  });
});

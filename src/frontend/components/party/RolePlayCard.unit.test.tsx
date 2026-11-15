import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import type { RolePlayCard as Card } from '@backend/contexts/parties/domain/PartyView';

import { RolePlayCard } from './RolePlayCard';

const t = messages.parties.page;

const card = (overrides: Partial<Card> = {}): Card => ({
  characterId: 'c1',
  ownerId: 'u1',
  name: 'Arani',
  avatarUrl: null,
  race: 'Elfa',
  class: 'Maga',
  level: 3,
  accentColor: null,
  ownerUsername: 'bia',
  personalityTraits: 'Curiosa demais',
  ideals: 'Saber',
  bonds: 'O mestre dela',
  flaws: 'Orgulho',
  passivePerception: 14,
  passiveInsight: 12,
  ...overrides,
});

describe('RolePlayCard', () => {
  it('raça e classe da lista aparecem no idioma de quem lê; as do jogador, como escritas (o nível primeiro)', () => {
    const { unmount } = renderWithProviders(
      <RolePlayCard partyId="p1" card={card({ race: 'half-elf', class: 'wizard' })} />,
    );
    expect(screen.getByText('Level 3 · Half-Elf · Wizard')).toBeInTheDocument();
    unmount();

    renderWithProviders(
      <RolePlayCard partyId="p1" card={card({ race: 'Aasimar', class: 'Artífice' })} />,
    );
    expect(screen.getByText('Level 3 · Aasimar · Artífice')).toBeInTheDocument();
  });

  it('mostra as passivas e linka para a ficha da mesa', () => {
    renderWithProviders(<RolePlayCard partyId="p1" card={card()} />);

    expect(screen.getByRole('link', { name: /Arani/ })).toHaveAttribute(
      'href',
      '/parties/p1/characters/c1',
    );
    expect(screen.getByText(t.passivePerception).nextSibling).toHaveTextContent('14');
    expect(screen.getByText(t.passiveInsight).nextSibling).toHaveTextContent('12');
    expect(screen.getByText('Level 3 · Elfa · Maga')).toBeInTheDocument();
    expect(screen.getByText('Played by @bia')).toBeInTheDocument();
    expect(screen.getByText('Curiosa demais')).toBeInTheDocument();
    expect(screen.getByText('Orgulho')).toBeInTheDocument();
  });

  it('o nome longo ocupa até duas linhas e mostra o nome inteiro no título', () => {
    const name = 'Revisão F2 A Chilli Ãçênto Nome Comprido Demais Para Caber';
    renderWithProviders(<RolePlayCard partyId="p1" card={card({ name })} />);

    const shown = screen.getByText(name);
    expect(shown).toHaveAttribute('title', name);
    expect(shown).toHaveClass('line-clamp-2', 'break-normal');
    expect(shown).not.toHaveClass('truncate');
    // The details wrap instead of cutting the level off
    expect(screen.getByText('Level 3 · Elfa · Maga')).not.toHaveClass('truncate');
  });

  it('o link esticado sai do Tab: sem avatar, só o Ver ficha', async () => {
    renderWithProviders(<RolePlayCard partyId="p1" card={card()} />);
    const user = userEvent.setup();

    // The link stays for the pointer and for screen readers, with the name
    expect(screen.getByRole('link', { name: /Arani/ })).toHaveAttribute('tabindex', '-1');
    await user.tab();
    expect(
      screen.getByRole('button', { name: `${messages.sheetViewer.open} Arani` }),
    ).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('com avatar, o Ver imagem também é uma parada, antes do Ver ficha', async () => {
    renderWithProviders(
      <RolePlayCard partyId="p1" card={card({ avatarUrl: 'https://img.test/a.webp' })} />,
    );
    const user = userEvent.setup();

    await user.tab();
    expect(
      screen.getByRole('button', {
        name: messages.avatarUpload.viewOf.replace('{name}', 'Arani'),
      }),
    ).toHaveFocus();
    await user.tab();
    expect(
      screen.getByRole('button', { name: `${messages.sheetViewer.open} Arani` }),
    ).toHaveFocus();
    await user.tab();
    expect(document.body).toHaveFocus();
  });

  it('sem lore não mostra rótulos vazios', () => {
    renderWithProviders(
      <RolePlayCard
        partyId="p1"
        card={card({ personalityTraits: null, ideals: null, bonds: null, flaws: null })}
      />,
    );

    for (const label of [t.personalityTraits, t.ideals, t.bonds, t.flaws]) {
      expect(screen.queryByText(label)).not.toBeInTheDocument();
    }
  });

  describe('ampliar a imagem', () => {
    const view = { name: messages.avatarUpload.viewOf.replace('{name}', 'Arani') };

    it('abre o modal com a imagem, sem estar dentro do link da ficha', async () => {
      renderWithProviders(
        <RolePlayCard partyId="p1" card={card({ avatarUrl: 'https://img.test/a.webp' })} />,
      );
      const button = screen.getByRole('button', view);

      expect(button.closest('a')).toBeNull();
      await userEvent.click(button);

      expect(screen.getByRole('img', { name: 'Arani' })).toBeInTheDocument();
    });

    it('sem imagem não mostra o botão', () => {
      renderWithProviders(<RolePlayCard partyId="p1" card={card()} />);

      expect(screen.queryByRole('button', view)).not.toBeInTheDocument();
    });
  });
});

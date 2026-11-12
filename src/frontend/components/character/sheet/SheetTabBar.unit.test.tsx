import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SheetTabBar } from './SheetTabBar';

const route = vi.hoisted(() => ({ pathname: '/' }));
vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'c1' }),
  usePathname: () => route.pathname,
}));

const tabs = messages.characters.tabs;

describe('SheetTabBar', () => {
  it('leva às quatro abas da ficha e marca a aberta', () => {
    route.pathname = '/system/dnd5e/character/c1/spells';
    renderWithProviders(<SheetTabBar characterId="c1" system="dnd5e" />);

    const nav = screen.getByRole('navigation', { name: tabs.label });
    expect(nav.querySelectorAll('a')).toHaveLength(4);
    expect(screen.getByRole('link', { name: tabs.spells })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: tabs.status })).not.toHaveAttribute('aria-current');
    expect(screen.getByRole('link', { name: tabs.status })).toHaveAttribute(
      'href',
      '/system/dnd5e/character/c1',
    );
  });

  it('Status fica marcado só na raiz da ficha', () => {
    route.pathname = '/system/dnd5e/character/c1';
    renderWithProviders(<SheetTabBar characterId="c1" system="dnd5e" />);

    expect(screen.getByRole('link', { name: tabs.status })).toHaveAttribute('aria-current', 'page');
    expect(screen.getByRole('link', { name: tabs.lore })).not.toHaveAttribute('aria-current');
  });
});

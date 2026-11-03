import { screen, within } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartySummary } from '@backend/contexts/parties/domain/Party';

import Sidebar from './Sidebar';

const navigation = vi.hoisted(() => ({ pathname: '/characters' }));

vi.mock('next/navigation', () => ({
  usePathname: () => navigation.pathname,
  useParams: () => ({}),
}));
vi.mock('@frontend/hooks/useProfile', () => ({ useProfile: () => ({ profile: null }) }));
vi.mock('@frontend/hooks/useAuth', () => ({ useAuth: () => ({ signOut: vi.fn() }) }));

const party = (id: string, role: PartySummary['role']): PartySummary => ({
  id,
  name: `Mesa ${id}`,
  system: 'dnd_5e',
  role,
  status: role === 'gm' ? 'gm' : 'active',
  gmUsername: null,
  pendingRequests: 0,
});

vi.mock('@frontend/hooks/useParties', () => ({
  useParties: () => ({
    parties: { asGm: [party('gm1', 'gm')], asPlayer: [party('pl1', 'player')] },
  }),
}));

const t = messages.parties.nav;
const sidebar = () => within(screen.getByRole('complementary'));

describe('Sidebar', () => {
  beforeEach(() => {
    navigation.pathname = '/characters';
  });

  it('a mesa aberta do mestre ganha o submenu Mesa / Diário / Inventário / Configurações', () => {
    navigation.pathname = '/parties/gm1/settings';
    renderWithProviders(<Sidebar />);

    expect(sidebar().getByRole('link', { name: t.overview })).toHaveAttribute(
      'href',
      '/parties/gm1',
    );
    expect(sidebar().getByRole('link', { name: t.journal })).toHaveAttribute(
      'href',
      '/parties/gm1/journal',
    );
    expect(sidebar().getByRole('link', { name: t.inventory })).toHaveAttribute(
      'href',
      '/parties/gm1/inventory',
    );
    const settings = sidebar().getByRole('link', { name: t.settings });
    expect(settings).toHaveAttribute('href', '/parties/gm1/settings');
    expect(settings).toHaveAttribute('aria-current', 'page');
  });

  it('na mesa como jogador: Mesa, Diário e Inventário, sem Configurações', () => {
    navigation.pathname = '/parties/pl1/journal';
    renderWithProviders(<Sidebar />);

    expect(sidebar().getByRole('link', { name: t.journal })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(sidebar().getByRole('link', { name: t.overview })).not.toHaveAttribute('aria-current');
    expect(sidebar().queryByRole('link', { name: t.settings })).not.toBeInTheDocument();
  });

  it('todas as mesas ficam sob Mesas, sem separar Mestre e Jogador', () => {
    renderWithProviders(<Sidebar />);
    expect(sidebar().getByRole('link', { name: 'Mesa gm1' })).toBeInTheDocument();
    expect(sidebar().getByRole('link', { name: 'Mesa pl1' })).toBeInTheDocument();
  });

  it('no desktop o "Sair" fica só no topo da página', () => {
    renderWithProviders(<Sidebar />);
    expect(
      sidebar().queryByRole('button', { name: messages.common.logout }),
    ).not.toBeInTheDocument();
  });

  it('fora da mesa não há submenu', () => {
    renderWithProviders(<Sidebar />);
    expect(sidebar().queryByRole('link', { name: t.journal })).not.toBeInTheDocument();
    expect(sidebar().queryByRole('link', { name: t.settings })).not.toBeInTheDocument();
  });
});

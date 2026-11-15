import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { PartySummary } from '@backend/contexts/parties/domain/Party';

import Sidebar, { MobileMenu } from './Sidebar';

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
  activePlayers: 0,
  hasGm: true,
});

vi.mock('@frontend/hooks/useParties', () => ({
  useParties: () => ({
    parties: { asGm: [party('gm1', 'gm')], asPlayer: [party('pl1', 'player')] },
  }),
}));

const sidebar = () => within(screen.getByRole('complementary'));

describe('Sidebar', () => {
  beforeEach(() => {
    navigation.pathname = '/characters';
  });

  it('a mesa aberta fica marcada em qualquer aba dela, sem submenu (as abas estão na mesa)', () => {
    navigation.pathname = '/parties/gm1/journal';
    renderWithProviders(<Sidebar />);

    expect(sidebar().getByRole('link', { name: 'Mesa gm1' })).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(sidebar().getByRole('link', { name: 'Mesa pl1' })).not.toHaveAttribute('aria-current');
    expect(sidebar().queryByRole('link', { name: /journal|diário/i })).not.toBeInTheDocument();
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

  it('a navegação tem nome, separada da de personagens ou NPCs', () => {
    renderWithProviders(<Sidebar />);
    expect(
      sidebar().getByRole('navigation', { name: messages.dashboard.mainNavigation }),
    ).toBeInTheDocument();
  });

  describe('recolher', () => {
    const tDash = messages.dashboard;
    const panel = () => screen.getByTestId('sidebar-panel');

    afterEach(() => {
      document.cookie = 'sidebar-pinned=; path=/; max-age=0';
    });

    /** A screen of at least 1024px (lg), where the menu starts open. */
    function stubWide(wide: boolean) {
      vi.spyOn(window, 'matchMedia').mockImplementation(
        (query: string) =>
          ({
            matches: wide && query === '(min-width: 64rem)',
            media: query,
            addEventListener: () => {},
            removeEventListener: () => {},
          }) as unknown as MediaQueryList,
      );
    }

    afterEach(() => vi.restoreAllMocks());

    it('sem escolha salva, abaixo de 1024px começa em trilho de ícones', () => {
      stubWide(false);
      renderWithProviders(<Sidebar />);

      expect(screen.getByRole('complementary')).toHaveAttribute('data-sidebar', 'rail');
      expect(panel()).toHaveAttribute('data-expanded', 'false');
      expect(sidebar().getByRole('button', { name: tDash.keepMenuOpen })).toBeInTheDocument();
    });

    it('sem escolha salva, a partir de 1024px começa fixa e aberta', () => {
      stubWide(true);
      renderWithProviders(<Sidebar />);

      expect(screen.getByRole('complementary')).toHaveAttribute('data-sidebar', 'pinned');
      expect(sidebar().getByRole('button', { name: tDash.collapseMenu })).toBeInTheDocument();
    });

    it('a escolha salva vence a largura da tela', () => {
      stubWide(false);
      renderWithProviders(<Sidebar initialPinned />);
      expect(screen.getByRole('complementary')).toHaveAttribute('data-sidebar', 'pinned');
    });

    it('recolher guarda a escolha', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sidebar initialPinned />);

      await user.click(sidebar().getByRole('button', { name: tDash.collapseMenu }));

      expect(document.cookie).toContain('sidebar-pinned=false');
      expect(screen.getByRole('complementary')).toHaveAttribute('data-sidebar', 'rail');
    });

    it('recolher pelo botão fecha na hora, com o mouse ainda em cima, e só cresce de novo depois que ele sai', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sidebar initialPinned />);

      await user.click(sidebar().getByRole('button', { name: tDash.collapseMenu }));
      expect(panel()).toHaveAttribute('data-expanded', 'false');

      fireEvent.mouseLeave(screen.getByRole('complementary'));
      fireEvent.mouseEnter(screen.getByRole('complementary'));
      expect(panel()).toHaveAttribute('data-expanded', 'true');
    });

    it('recolher pelo teclado não reabre pelo foco até o foco sair do menu', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <>
          <Sidebar initialPinned />
          <button type="button">page</button>
        </>,
      );

      sidebar().getByRole('button', { name: tDash.collapseMenu }).focus();
      await user.keyboard('{Enter}');
      expect(panel()).toHaveAttribute('data-expanded', 'false');

      // Still inside the menu: Tab back onto its links keeps it closed
      await user.tab({ shift: true });
      expect(panel()).toHaveAttribute('data-expanded', 'false');

      // Out and back in: it grows with the focus again
      screen.getByRole('button', { name: 'page' }).focus();
      await user.tab({ shift: true });
      expect(panel()).toHaveAttribute('data-expanded', 'true');
    });

    it('Esc fecha o menu aberto pelo foco do teclado', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sidebar initialPinned={false} />);

      await user.tab();
      expect(panel()).toHaveAttribute('data-expanded', 'true');

      await user.keyboard('{Escape}');
      expect(panel()).toHaveAttribute('data-expanded', 'false');
    });

    it('recolhido, cresce com o mouse e encolhe quando ele sai', () => {
      renderWithProviders(<Sidebar initialPinned={false} />);
      expect(panel()).toHaveAttribute('data-expanded', 'false');

      fireEvent.mouseEnter(screen.getByRole('complementary'));
      expect(panel()).toHaveAttribute('data-expanded', 'true');

      fireEvent.mouseLeave(screen.getByRole('complementary'));
      expect(panel()).toHaveAttribute('data-expanded', 'false');
    });

    it('recolhido, cresce com o foco do teclado e os links seguem com nome', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sidebar initialPinned={false} />);

      await user.tab();

      expect(panel()).toHaveAttribute('data-expanded', 'true');
      expect(sidebar().getByRole('link', { name: tDash.myCharacters })).toHaveAttribute(
        'href',
        '/characters',
      );
    });

    it('recolhido, manter aberto volta ao menu fixo', async () => {
      const user = userEvent.setup();
      renderWithProviders(<Sidebar initialPinned={false} />);

      await user.click(sidebar().getByRole('button', { name: tDash.keepMenuOpen }));

      expect(document.cookie).toContain('sidebar-pinned=true');
      expect(screen.getByRole('complementary')).toHaveAttribute('data-sidebar', 'pinned');
    });
  });
});

describe('MobileMenu', () => {
  it('a gaveta fecha ao tocar num link', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileMenu />);

    await user.click(screen.getByRole('button', { name: messages.dashboard.openMenu }));
    const drawer = await screen.findByRole('dialog', { name: messages.dashboard.menu });
    const link = within(drawer).getByRole('link', { name: messages.dashboard.myCharacters });
    // The navigation itself is Next's; only the drawer closing is under test here
    link.addEventListener('click', (event) => event.preventDefault());
    await user.click(link);

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('o "Sair" da gaveta é o mesmo do header, com ícone', async () => {
    const user = userEvent.setup();
    renderWithProviders(<MobileMenu />);

    await user.click(screen.getByRole('button', { name: messages.dashboard.openMenu }));
    const drawer = await screen.findByRole('dialog', { name: messages.dashboard.menu });
    expect(
      within(drawer).getByRole('button', { name: messages.common.logout }),
    ).toBeInTheDocument();
  });
});

import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

import { DemoFrame } from './DemoFrame';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));
const params = vi.hoisted(() => ({ value: {} as { id?: string } }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/demo',
  useParams: () => params.value,
}));
vi.mock('@frontend/components/character/CharacterNavSection', () => ({
  default: () => <p>sheet nav</p>,
}));

const open = vi.fn();
vi.mock('./DemoContext', () => ({
  useDemo: () => ({ isDemo: true, inviteOpen: false, setInviteOpen: vi.fn(), refuseWrite: open }),
}));

const t = messages.demo;

describe('DemoFrame', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    params.value = {};
  });

  it('on a phone, the header scrolls away and the sheet nav leaves it to the tab bar', () => {
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });
    params.value = { id: 'ada' };
    renderWithProviders(<DemoFrame>content</DemoFrame>);

    // Sticky from md up only: on a phone, header and tab bar took a quarter of the screen
    const header = screen.getByRole('banner');
    expect(header).not.toHaveClass('sticky');
    expect(header).toHaveClass('md:sticky');
    expect(screen.getByText('sheet nav').closest('aside')).toHaveClass('hidden', 'md:block');
    // What sticks below the header (VitalsBar, the Grimoire) starts under it, from md up
    expect(screen.getByRole('main').parentElement?.className).toContain('md:[--sticky-top:');
  });

  it('offers to create an account to someone signed out', () => {
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });
    renderWithProviders(<DemoFrame>content</DemoFrame>);

    expect(screen.getByRole('link', { name: t.banner.signUp })).toHaveAttribute(
      'href',
      '/register',
    );
    expect(screen.getByRole('link', { name: t.nav.chest })).toHaveAttribute(
      'href',
      '/demo/inventory',
    );
    expect(screen.getByRole('link', { name: t.nav.npcs })).toHaveAttribute('href', '/demo/npcs');
    expect(screen.getByRole('main')).toHaveTextContent('content');
  });

  it('sends someone signed in back to the app', () => {
    vi.mocked(useSession).mockReturnValue({ user: { id: 'u1' }, status: 'signed-in' });
    renderWithProviders(<DemoFrame>content</DemoFrame>);

    expect(screen.getByRole('link', { name: t.banner.back })).toHaveAttribute(
      'href',
      '/characters',
    );
    expect(screen.queryByRole('link', { name: t.banner.signUp })).not.toBeInTheDocument();
  });
});

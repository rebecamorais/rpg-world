import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

import { DemoFrame } from './DemoFrame';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));
vi.mock('next/navigation', () => ({
  usePathname: () => '/demo',
  useParams: () => ({}),
}));
vi.mock('@frontend/components/character/CharacterNavSection', () => ({ default: () => null }));

const open = vi.fn();
vi.mock('./DemoContext', () => ({
  useDemo: () => ({ isDemo: true, inviteOpen: false, setInviteOpen: vi.fn(), openInvite: open }),
}));

const t = messages.demo;

describe('DemoFrame', () => {
  beforeEach(() => vi.clearAllMocks());

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

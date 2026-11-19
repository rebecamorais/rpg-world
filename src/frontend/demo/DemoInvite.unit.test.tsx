import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

import { DemoInvite } from './DemoInvite';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));

const demo = { isDemo: true, inviteOpen: true, setInviteOpen: vi.fn() };
vi.mock('./DemoContext', () => ({ useDemo: () => demo }));

const t = messages.demo.invite;

describe('DemoInvite', () => {
  beforeEach(() => {
    demo.inviteOpen = true;
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });
  });

  it('invites to create an account and can be dismissed', async () => {
    renderWithProviders(<DemoInvite />);

    expect(screen.getByRole('dialog', { name: t.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.create })).toHaveAttribute('href', '/register');

    await userEvent.click(screen.getByRole('button', { name: t.keep }));
    expect(demo.setInviteOpen).toHaveBeenCalledWith(false);
  });

  it('signed in, sends back to the app instead of selling an account', () => {
    vi.mocked(useSession).mockReturnValue({
      user: { id: 'u1', email: 'a@example.com' },
      status: 'signed-in',
    });
    renderWithProviders(<DemoInvite />);

    const dialog = screen.getByRole('dialog', { name: t.signedInTitle });
    expect(dialog).toHaveTextContent(t.signedInDescription);
    expect(dialog).not.toHaveTextContent(t.description);
    expect(screen.getByRole('link', { name: messages.demo.banner.back })).toHaveAttribute(
      'href',
      '/characters',
    );
    expect(screen.queryByRole('link', { name: t.create })).not.toBeInTheDocument();
  });

  it('stays closed until something asks for it', () => {
    demo.inviteOpen = false;
    renderWithProviders(<DemoInvite />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

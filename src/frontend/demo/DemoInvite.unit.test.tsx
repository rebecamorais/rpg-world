import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { DemoInvite } from './DemoInvite';

const demo = { isDemo: true, inviteOpen: true, setInviteOpen: vi.fn() };
vi.mock('./DemoContext', () => ({ useDemo: () => demo }));

const t = messages.demo.invite;

describe('DemoInvite', () => {
  it('invites to create an account and can be dismissed', async () => {
    renderWithProviders(<DemoInvite />);

    expect(screen.getByRole('dialog', { name: t.title })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.create })).toHaveAttribute('href', '/register');

    await userEvent.click(screen.getByRole('button', { name: t.keep }));
    expect(demo.setInviteOpen).toHaveBeenCalledWith(false);
  });

  it('stays closed until something asks for it', () => {
    demo.inviteOpen = false;
    renderWithProviders(<DemoInvite />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

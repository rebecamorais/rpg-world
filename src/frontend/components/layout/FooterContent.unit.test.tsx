import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import FooterContent from './FooterContent';

vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn() },
}));

const t = messages.footer;

describe('FooterContent', () => {
  afterEach(() => {
    document.cookie = 'sb-ref-auth-token=; max-age=0';
  });

  it('com a sessão lida pelo servidor não pede /api/auth/session', () => {
    document.cookie = 'sb-ref-auth-token=x';

    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} />);

    expect(screen.getByRole('link', { name: t.explore.characters })).toBeInTheDocument();
    expect(vi.mocked(rpgWorldApi).get).not.toHaveBeenCalled();
  });
});

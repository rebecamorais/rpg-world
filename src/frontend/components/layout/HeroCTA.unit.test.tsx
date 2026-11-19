import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

import HeroCTA from './HeroCTA';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));

describe('HeroCTA', () => {
  it('sem login, "Começar a jogar" leva ao cadastro, ao lado da demo', () => {
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(<HeroCTA />);

    expect(screen.getByRole('link', { name: messages.landing.ctaDemo })).toHaveAttribute(
      'href',
      '/demo',
    );
    expect(screen.getByRole('link', { name: messages.landing.ctaStart })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('logado, leva aos personagens', () => {
    vi.mocked(useSession).mockReturnValue({ user: { id: 'u1' }, status: 'signed-in' });

    renderWithProviders(<HeroCTA />);

    expect(screen.getByRole('link', { name: messages.landing.ctaStart })).toHaveAttribute(
      'href',
      '/characters',
    );
  });
});

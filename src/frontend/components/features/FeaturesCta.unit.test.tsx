import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

import { FeaturesCta } from './FeaturesCta';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));

const t = messages.features;

describe('FeaturesCta', () => {
  it('quem está logado vai para os personagens', () => {
    vi.mocked(useSession).mockReturnValue({ user: { id: 'u1' }, status: 'signed-in' });

    renderWithProviders(<FeaturesCta />);

    expect(screen.getByRole('link', { name: t.ctaCharacters })).toHaveAttribute(
      'href',
      '/characters',
    );
  });

  it('quem não está logado vai para o cadastro', () => {
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(<FeaturesCta />);

    expect(screen.getByRole('link', { name: t.ctaStart })).toHaveAttribute('href', '/register');
  });
});

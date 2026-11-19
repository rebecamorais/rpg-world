import { screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { useSession } from '@frontend/hooks/useSession';

import { PlayCta } from './PlayCta';

vi.mock('@frontend/hooks/useSession', () => ({ useSession: vi.fn() }));

const LABELS = { startLabel: 'Start playing', demoLabel: 'See the demo' };

describe('PlayCta', () => {
  it('quem não está logado vai para o cadastro, não para o login', () => {
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(<PlayCta {...LABELS} />);

    expect(screen.getByRole('link', { name: 'Start playing' })).toHaveAttribute(
      'href',
      '/register',
    );
  });

  it('quem está logado vai para os personagens, com o rótulo próprio se houver', () => {
    vi.mocked(useSession).mockReturnValue({ user: { id: 'u1' }, status: 'signed-in' });

    renderWithProviders(<PlayCta {...LABELS} signedInLabel="Go to my characters" />);

    expect(screen.getByRole('link', { name: 'Go to my characters' })).toHaveAttribute(
      'href',
      '/characters',
    );
  });

  it('logado e sem rótulo próprio, o botão principal mantém o texto', () => {
    vi.mocked(useSession).mockReturnValue({ user: { id: 'u1' }, status: 'signed-in' });

    renderWithProviders(<PlayCta {...LABELS} />);

    expect(screen.getByRole('link', { name: 'Start playing' })).toHaveAttribute(
      'href',
      '/characters',
    );
  });

  it('também leva à demo, com o mesmo tamanho grande nos dois botões', () => {
    vi.mocked(useSession).mockReturnValue({ user: null, status: 'signed-out' });

    renderWithProviders(<PlayCta {...LABELS} />);

    const demo = screen.getByRole('link', { name: 'See the demo' });
    expect(demo).toHaveAttribute('href', '/demo');
    expect(demo).toHaveClass('h-12');
    expect(screen.getByRole('link', { name: 'Start playing' })).toHaveClass('h-12');
  });
});

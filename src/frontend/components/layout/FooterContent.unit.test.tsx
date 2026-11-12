import { fireEvent, screen, waitFor } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import FooterContent from './FooterContent';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@client', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@client')>()),
  rpgWorldApi: { get: vi.fn() },
}));

const t = messages.footer;

describe('FooterContent', () => {
  afterEach(() => {
    document.cookie = 'sb-ref-auth-token=; max-age=0';
    vi.clearAllMocks();
  });

  function mockClipboard(writeText: () => Promise<void>) {
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn(writeText) },
      configurable: true,
    });
  }

  it('com a sessão lida pelo servidor não pede /api/auth/session', () => {
    document.cookie = 'sb-ref-auth-token=x';

    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} />);

    expect(screen.getByRole('link', { name: t.explore.characters })).toBeInTheDocument();
    expect(vi.mocked(rpgWorldApi).get).not.toHaveBeenCalled();
  });

  it('compacto (dentro do app): uma linha com os links legais e as formas de apoio', () => {
    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} compact />);

    expect(screen.queryByText(messages.landing.heroSubtitle)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: t.legal.terms })).toHaveAttribute('href', '/terms');
    expect(screen.getByRole('link', { name: t.support.kofi })).toHaveAttribute(
      'href',
      'https://ko-fi.com/rebecamorais',
    );
    expect(screen.getByRole('link', { name: t.support.githubSponsorsCta })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: t.support.pixCopyLabel })).toBeInTheDocument();
  });

  it('copia a chave Pix e só então avisa que copiou', async () => {
    mockClipboard(() => Promise.resolve());
    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} compact />);

    fireEvent.click(screen.getByRole('button', { name: t.support.pixCopyLabel }));

    await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t.support.pixCopy));
    expect(toast.error).not.toHaveBeenCalled();
  });

  it('quando o navegador recusa a cópia, mostra a chave no erro em vez do sucesso', async () => {
    mockClipboard(() => Promise.reject(new Error('denied')));
    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} compact />);

    fireEvent.click(screen.getByRole('button', { name: t.support.pixCopyLabel }));

    await waitFor(() => expect(toast.error).toHaveBeenCalledOnce());
    expect(toast.success).not.toHaveBeenCalled();
  });
});

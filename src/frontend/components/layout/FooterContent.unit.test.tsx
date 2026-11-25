import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { rpgWorldApi } from '@client';

import pt from '../../../../messages/pt.json';
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

  it('completo: o nome em destaque é o do app, e o estúdio fica só no copyright', () => {
    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} />);

    expect(screen.getByText(messages.common.title)).toBeInTheDocument();
    expect(screen.queryByText('Rebs Tech Studio')).not.toBeInTheDocument();
    expect(screen.getByText(/Rebs Tech Studio/)).toHaveTextContent(
      t.copyright.replace('{year}', String(new Date().getFullYear())),
    );
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

  it('GitHub e Discord ficam numa coluna Comunidade, fora de Legal', () => {
    renderWithProviders(<FooterContent serverUser={null} />);

    const column = (title: string) =>
      within(screen.getByRole('heading', { name: title }).parentElement!);
    expect(
      column(t.socials.title).getByRole('link', { name: t.socials.github }),
    ).toBeInTheDocument();
    expect(
      column(t.socials.title).getByRole('link', { name: t.socials.discord }),
    ).toBeInTheDocument();
    expect(column(t.legal.title).queryByRole('link', { name: t.socials.github })).toBeNull();
  });

  it('compacto: o apoio é um grupo com o rótulo no começo, separado dos links legais', () => {
    renderWithProviders(<FooterContent serverUser={{ id: 'u1' }} compact />);

    const support = screen.getByRole('group', { name: t.support.title });
    expect(within(support).getByRole('link', { name: t.support.kofi })).toBeInTheDocument();
    expect(within(support).queryByRole('link', { name: t.socials.discord })).toBeNull();
    expect(support.firstElementChild).toHaveTextContent(t.support.title);
  });

  it('em português, as páginas públicas abrem no endereço em português e o app fica sem prefixo', () => {
    renderWithProviders(
      <NextIntlClientProvider locale="pt" messages={pt} timeZone="UTC">
        <FooterContent />
      </NextIntlClientProvider>,
    );

    const tPt = pt.footer;
    expect(screen.getByRole('link', { name: tPt.explore.home })).toHaveAttribute('href', '/pt');
    expect(screen.getByRole('link', { name: tPt.explore.features })).toHaveAttribute(
      'href',
      '/pt/features',
    );
    expect(screen.getByRole('link', { name: tPt.legal.privacy })).toHaveAttribute(
      'href',
      '/pt/privacy',
    );
  });

  it('logada em português, o link dos personagens continua sem prefixo', () => {
    renderWithProviders(
      <NextIntlClientProvider locale="pt" messages={pt} timeZone="UTC">
        <FooterContent serverUser={{ id: 'u1' }} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('link', { name: pt.footer.explore.characters })).toHaveAttribute(
      'href',
      '/characters',
    );
  });
});

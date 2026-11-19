import { screen, within } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import pt from '../../../../messages/pt.json';
import PrivacyPage, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async (options: string | { namespace: string }) =>
    createTranslator({
      locale: 'pt',
      messages: pt,
      namespace: (typeof options === 'string' ? options : options.namespace) as never,
    }),
}));

const params = Promise.resolve({ locale: 'pt' });
const t = pt.privacy;

describe('política de privacidade', () => {
  it('tem um índice que leva a cada seção', async () => {
    renderWithProviders(await PrivacyPage({ params }));

    const toc = screen.getByRole('navigation', { name: pt.common.onThisPage });
    const sections = Object.entries(t.sections);
    expect(within(toc).getAllByRole('link')).toHaveLength(sections.length);
    expect(within(toc).getByRole('link', { name: t.sections.cookies.title })).toHaveAttribute(
      'href',
      '#cookies',
    );
    expect(screen.getByRole('region', { name: t.sections.cookies.title })).toHaveAttribute(
      'id',
      'cookies',
    );
  });

  it('mostra todos os itens das listas, também os dados técnicos (o último)', async () => {
    renderWithProviders(await PrivacyPage({ params }));

    const data = screen.getByRole('region', { name: t.sections.data.title });
    expect(within(data).getAllByRole('listitem')).toHaveLength(t.sections.data.items.length);
    expect(within(data).getByText(/Dados técnicos/)).toBeInTheDocument();
  });

  it('o compartilhamento vira listas: os serviços e quem vê o quê', async () => {
    renderWithProviders(await PrivacyPage({ params }));

    const sharing = screen.getByRole('region', { name: t.sections.sharing.title });
    const [services, visibility] = within(sharing).getAllByRole('list');
    expect(within(services).getAllByRole('listitem')).toHaveLength(
      t.sections.sharing.services.length,
    );
    expect(within(visibility).getAllByRole('listitem')).toHaveLength(
      t.sections.sharing.visibility.length,
    );
  });

  it('sem "← Voltar" fixo para a home, e o suporte no endereço em português', async () => {
    renderWithProviders(await PrivacyPage({ params }));

    expect(screen.queryByRole('link', { name: pt.common.back })).toBeNull();
    expect(screen.getAllByRole('link', { name: 'formulário de suporte' })[0]).toHaveAttribute(
      'href',
      '/pt/support',
    );
  });

  it('tem descrição própria e o canonical em português', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe(t.metaDescription);
    expect(metadata.alternates?.canonical).toBe('/pt/privacy');
  });
});

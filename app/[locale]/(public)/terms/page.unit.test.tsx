import { screen, within } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import TermsPage, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async (options: string | { namespace: string }) =>
    createTranslator({
      locale: 'en',
      messages,
      namespace: (typeof options === 'string' ? options : options.namespace) as never,
    }),
}));

const params = Promise.resolve({ locale: 'en' });
const t = messages.terms;

describe('termos de uso', () => {
  it('o SRD em espanhol leva ao documento, não à home genérica para onde o endereço antigo redireciona', async () => {
    renderWithProviders(await TermsPage({ params }));

    const srdEs = screen.getByRole('link', {
      name: 'https://dnd.wizards.com/es/resources/systems-reference-document',
    });
    expect(srdEs).toHaveAttribute(
      'href',
      'https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1_ES.pdf',
    );
  });

  it('mostra todos os créditos, também o do NOTICE.md (o último)', async () => {
    renderWithProviders(await TermsPage({ params }));

    const credits = screen.getByRole('region', { name: t.sections.gameContent.title });
    expect(within(credits).getAllByRole('listitem')).toHaveLength(
      t.sections.gameContent.items.length,
    );
    expect(within(credits).getByRole('link', { name: 'NOTICE.md' })).toBeInTheDocument();
  });

  it('tem índice e nenhum "← Voltar"', async () => {
    renderWithProviders(await TermsPage({ params }));

    const toc = screen.getByRole('navigation', { name: messages.common.onThisPage });
    expect(within(toc).getAllByRole('link')).toHaveLength(Object.keys(t.sections).length);
    expect(screen.queryByRole('link', { name: messages.common.back })).toBeNull();
  });

  it('tem descrição própria, também no cartão compartilhado', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata.description).toBe(t.metaDescription);
    expect(metadata.openGraph?.description).toBe(t.metaDescription);
    expect(metadata.alternates?.languages).toMatchObject({ 'pt-BR': '/pt/terms' });
  });
});

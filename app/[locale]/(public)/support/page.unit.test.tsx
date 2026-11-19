import { screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { createTranslator } from 'next-intl';
import { describe, expect, it, vi } from 'vitest';

import { DISCORD_INVITE } from '@frontend/constants/site';

import SupportPage, { generateMetadata } from './page';

vi.mock('next-intl/server', () => ({
  setRequestLocale: vi.fn(),
  getTranslations: async (options: string | { namespace: string }) =>
    createTranslator({
      locale: 'en',
      messages,
      namespace: (typeof options === 'string' ? options : options.namespace) as never,
    }),
}));
// The card has its own tests; here, only what the page adds around it
vi.mock('@frontend/components/feedback/ContactCard', () => ({
  default: () => null,
  SupportContactCard: () => null,
}));

const params = Promise.resolve({ locale: 'en' });

describe('página de suporte', () => {
  it('oferece o Discord ao lado do formulário', async () => {
    renderWithProviders(await SupportPage({ params }));

    expect(screen.getByRole('link', { name: 'Discord' })).toHaveAttribute('href', DISCORD_INVITE);
  });

  it('o cartão compartilhado usa a descrição da página, não a do site', async () => {
    const metadata = await generateMetadata({ params });

    expect(metadata.openGraph?.description).toBe(messages.feedback.subtitle);
    expect(metadata.twitter?.description).toBe(messages.feedback.subtitle);
  });
});

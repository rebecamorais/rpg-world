import { render, screen } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { describe, expect, it } from 'vitest';

import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';
import { DemoInspiration } from './DemoInspiration';

const inspiration = {
  realName: 'Ada Lovelace',
  period: '1815–1852',
  contribution: 'Wrote the first published program.',
  sources: [{ label: 'Wikipedia', url: 'https://en.wikipedia.org/wiki/Ada_Lovelace' }],
};

describe('DemoInspiration', () => {
  it.each([
    ['en', en, 'Meet the Inspiration'],
    ['pt', pt, 'Conheça a inspiração'],
  ])('shows the facts, the sources and the tribute notice in %s', (locale, messages, title) => {
    render(
      <NextIntlClientProvider locale={locale} messages={messages}>
        <DemoInspiration inspiration={inspiration} />
      </NextIntlClientProvider>,
    );

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText('Ada Lovelace')).toBeInTheDocument();
    expect(screen.getByText('1815–1852')).toBeInTheDocument();
    expect(screen.getByText(inspiration.contribution)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Wikipedia' })).toHaveAttribute(
      'href',
      inspiration.sources[0].url,
    );
    expect(screen.getByText(messages.demo.notice)).toBeInTheDocument();
  });

  it('keeps the notice text from the spec', () => {
    expect(en.demo.notice).toMatch(/^Meet the women who inspired a world of adventure\./);
    expect(en.demo.notice).toMatch(
      /not historically accurate portrayals or official endorsements\.$/,
    );
    expect(pt.demo.notice).toMatch(/^Conheça as mulheres que inspiraram um mundo de aventuras\./);
    expect(pt.demo.notice).toMatch(/endossos oficiais\.$/);
  });
});

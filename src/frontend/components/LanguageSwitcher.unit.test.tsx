import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import LanguageSwitcher from './LanguageSwitcher';

const replace = vi.fn();
const realLocation = window.location;

/** The page the switcher is on; `replace` records where it sends the browser. */
function stubLocation(pathname: string, search = '', hash = '') {
  Object.defineProperty(window, 'location', {
    configurable: true,
    value: { pathname, search, hash, replace },
  });
}

async function pick(name: string) {
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox', { name: messages.common.language }));
  await user.click(await screen.findByRole('option', { name }));
}

describe('LanguageSwitcher', () => {
  beforeEach(() => {
    replace.mockClear();
    document.cookie = 'NEXT_LOCALE=; path=/; max-age=0';
    sessionStorage.clear();
    localStorage.clear();
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', { configurable: true, value: realLocation });
  });

  it('cada idioma aparece no próprio idioma, para quem não lê o atual', async () => {
    const user = userEvent.setup();
    renderWithProviders(<LanguageSwitcher />);

    await user.click(screen.getByRole('combobox', { name: messages.common.language }));

    expect(await screen.findByRole('option', { name: 'Português' })).toHaveAttribute('lang', 'pt');
    expect(screen.getByRole('option', { name: 'English' })).toHaveAttribute('lang', 'en');
  });

  it('abre a mesma página no idioma novo pelo caminho com o idioma, sem gravar o cookie antes', async () => {
    stubLocation('/characters/abc', '?tab=spells', '#level-3');
    renderWithProviders(<LanguageSwitcher />);

    await pick('Português');

    // The proxy saves the cookie only if the page is really left (not if "leave?" is cancelled)
    expect(replace).toHaveBeenCalledWith('/pt/characters/abc?tab=spells#level-3');
    expect(document.cookie).not.toContain('NEXT_LOCALE');
  });

  it('na página inicial vai para /pt, sem barra a mais', async () => {
    stubLocation('/');
    renderWithProviders(<LanguageSwitcher />);

    await pick('Português');

    expect(replace).toHaveBeenCalledWith('/pt');
  });
});

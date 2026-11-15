import { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { WEBLATE_PROJECT } from '@frontend/constants/site';

import en from '../../../messages/en.json';
import pt from '../../../messages/pt.json';
import { useTranslationInvite } from './useTranslationInvite';

vi.mock('sonner', () => ({ toast: vi.fn() }));

const messages = { en, pt };

/** Mounts the hook in `locale`, as a page load does. */
function mount(signedIn: boolean, locale: 'en' | 'pt') {
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
  return renderHook(() => useTranslationInvite(signedIn), { wrapper });
}

/**
 * Picks a language: the switcher then loads the page in it, so it mounts again in `to`. With
 * `cancelled`, the person stayed (unsaved edits): the next page is still in `from`.
 */
function switchTo(
  signedIn: boolean,
  from: 'en' | 'pt',
  to: 'en' | 'pt',
  { cancelled = false } = {},
) {
  const before = mount(signedIn, from);
  act(() => before.result.current(to));
  before.unmount();
  return mount(signedIn, cancelled ? from : to);
}

describe('useTranslationInvite', () => {
  beforeEach(() => {
    vi.mocked(toast).mockClear();
    sessionStorage.clear();
    localStorage.clear();
  });

  it('logado, ao trocar de idioma convida para traduzir depois do reload, já no idioma novo', () => {
    switchTo(true, 'en', 'pt');

    expect(toast).toHaveBeenCalledTimes(1);
    const [title, options] = vi.mocked(toast).mock.calls[0];
    expect(title).toBe(pt.translationInvite.title);
    expect(options).toMatchObject({
      description: pt.translationInvite.description,
      action: { label: pt.translationInvite.action },
    });
  });

  it('o botão abre o projeto no Weblate', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    switchTo(true, 'en', 'pt');

    const [, options] = vi.mocked(toast).mock.calls[0];
    const action = (options as unknown as { action: { onClick: () => void } }).action;
    action.onClick();
    expect(open).toHaveBeenCalledWith(WEBLATE_PROJECT, '_blank', 'noopener,noreferrer');
  });

  it('convida uma vez só: as trocas seguintes não cobrem a tela de novo', () => {
    switchTo(true, 'en', 'pt').unmount();
    mount(true, 'pt').unmount();
    switchTo(true, 'pt', 'en').unmount();
    switchTo(true, 'en', 'pt');
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it('troca cancelada (alterações não salvas): não convida na página que ficou no idioma antigo', () => {
    switchTo(true, 'en', 'pt', { cancelled: true }).unmount();
    expect(toast).not.toHaveBeenCalled();

    // The invite is still owed to the next real switch
    switchTo(true, 'en', 'pt');
    expect(toast).toHaveBeenCalledTimes(1);
  });

  it('sem login, não convida', () => {
    switchTo(false, 'en', 'pt');
    expect(toast).not.toHaveBeenCalled();
  });

  it('não mostra nada numa visita comum, sem troca pedida', () => {
    mount(true, 'pt');
    expect(toast).not.toHaveBeenCalled();
  });

  it('com o storage bloqueado, trocar não quebra', () => {
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw new DOMException('blocked', 'SecurityError');
    });
    expect(() => switchTo(true, 'en', 'pt')).not.toThrow();
  });
});

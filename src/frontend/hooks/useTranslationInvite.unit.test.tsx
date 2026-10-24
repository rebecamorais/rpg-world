import { ReactNode } from 'react';

import { act, renderHook } from '@testing-library/react';
import { NextIntlClientProvider } from 'next-intl';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CROWDIN_PROJECT } from '@frontend/constants/site';

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

/** Picks a language: the switcher then reloads, so the page mounts again in it. */
function switchTo(signedIn: boolean, from: 'en' | 'pt', to: 'en' | 'pt') {
  const before = mount(signedIn, from);
  act(() => before.result.current());
  before.unmount();
  return mount(signedIn, to);
}

describe('useTranslationInvite', () => {
  beforeEach(() => {
    vi.mocked(toast).mockClear();
    sessionStorage.clear();
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

  it('o botão abre o projeto no Crowdin', () => {
    const open = vi.spyOn(window, 'open').mockReturnValue(null);
    switchTo(true, 'en', 'pt');

    const [, options] = vi.mocked(toast).mock.calls[0];
    const action = (options as unknown as { action: { onClick: () => void } }).action;
    action.onClick();
    expect(open).toHaveBeenCalledWith(CROWDIN_PROJECT, '_blank', 'noopener,noreferrer');
  });

  it('convida a cada troca, e só uma vez por troca', () => {
    switchTo(true, 'en', 'pt').unmount();
    mount(true, 'pt').unmount();
    switchTo(true, 'pt', 'en');
    expect(toast).toHaveBeenCalledTimes(2);
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

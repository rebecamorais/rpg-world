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

/** Renders the hook in `locale`; `rerender` with another locale is what router.refresh does. */
function setup(signedIn: boolean) {
  let locale: 'en' | 'pt' = 'en';
  const wrapper = ({ children }: { children: ReactNode }) => (
    <NextIntlClientProvider locale={locale} messages={messages[locale]} timeZone="UTC">
      {children}
    </NextIntlClientProvider>
  );
  const hook = renderHook(() => useTranslationInvite(signedIn), { wrapper });
  const switchTo = (next: 'en' | 'pt') => {
    act(() => hook.result.current());
    locale = next;
    hook.rerender();
  };
  return { switchTo };
}

describe('useTranslationInvite', () => {
  beforeEach(() => vi.mocked(toast).mockClear());

  it('logado, ao trocar de idioma convida para traduzir, já no idioma novo', () => {
    const { switchTo } = setup(true);
    switchTo('pt');

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
    const { switchTo } = setup(true);
    switchTo('pt');

    const [, options] = vi.mocked(toast).mock.calls[0];
    const action = (options as unknown as { action: { onClick: () => void } }).action;
    action.onClick();
    expect(open).toHaveBeenCalledWith(CROWDIN_PROJECT, '_blank', 'noopener,noreferrer');
  });

  it('convida a cada troca', () => {
    const { switchTo } = setup(true);
    switchTo('pt');
    switchTo('en');
    expect(toast).toHaveBeenCalledTimes(2);
  });

  it('sem login, não convida', () => {
    const { switchTo } = setup(false);
    switchTo('pt');
    expect(toast).not.toHaveBeenCalled();
  });
});

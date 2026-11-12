import { fireEvent, render, renderHook } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { useLeaveGuard, useSaveShortcut } from './useUnsavedChanges';

const insideSheet = (pathname: string) => pathname.startsWith('/sheet');

function Links({ isDirty }: { isDirty: boolean }) {
  useLeaveGuard(isDirty, insideSheet, 'Leave?');
  return (
    // Plain anchors on purpose: the guard intercepts clicks on <a>, which is what <Link> renders.
    // The lint rule reads app/[locale] as matching any path, so it flags these as internal pages.
    <>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/sheet/lore">Lore</a>
      {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
      <a href="/characters">List</a>
    </>
  );
}

/** Returns whether the click was cancelled (the navigation would not happen). */
function click(link: HTMLElement) {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true, button: 0 });
  link.dispatchEvent(event);
  return event.defaultPrevented;
}

describe('useLeaveGuard', () => {
  afterEach(() => vi.restoreAllMocks());

  it('pergunta antes de seguir um link para fora, e respeita a resposta', () => {
    const confirm = vi
      .spyOn(window, 'confirm')
      .mockReturnValueOnce(false)
      .mockReturnValueOnce(true);
    const { getByText } = render(<Links isDirty />);

    expect(click(getByText('List'))).toBe(true);
    expect(click(getByText('List'))).toBe(false);
    expect(confirm).toHaveBeenCalledWith('Leave?');
  });

  it('deixa navegar livremente dentro da ficha e quando não há alterações', () => {
    const confirm = vi.spyOn(window, 'confirm');
    const { getByText, rerender } = render(<Links isDirty />);

    expect(click(getByText('Lore'))).toBe(false);
    rerender(<Links isDirty={false} />);
    expect(click(getByText('List'))).toBe(false);
    expect(confirm).not.toHaveBeenCalled();
  });

  it('com dois rascunhos na ficha, pergunta uma vez só', () => {
    const confirm = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const { getAllByText } = render(
      <>
        <Links isDirty />
        <Links isDirty />
      </>,
    );

    expect(click(getAllByText('List')[0])).toBe(false);
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  describe('Voltar/Avançar do navegador', () => {
    // jsdom has no Navigation API: a bare EventTarget stands in for window.navigation
    const navigation = new EventTarget();
    beforeAll(() =>
      Object.defineProperty(window, 'navigation', { value: navigation, configurable: true }),
    );
    afterAll(() => Reflect.deleteProperty(window, 'navigation'));

    /** Returns whether the Back press was cancelled. */
    function traverseTo(pathname: string, { cancelable = true } = {}) {
      const event = Object.assign(new Event('navigate', { cancelable }), {
        navigationType: 'traverse',
        destination: { url: new URL(pathname, window.location.href).href },
      });
      navigation.dispatchEvent(event);
      return event.defaultPrevented;
    }

    it('ao sair da ficha, pergunta e respeita a resposta', () => {
      vi.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
      render(<Links isDirty />);

      expect(traverseTo('/characters')).toBe(true);
      expect(traverseTo('/characters')).toBe(false);
    });

    it('voltar para outra aba da mesma ficha não pergunta', () => {
      const confirm = vi.spyOn(window, 'confirm');
      render(<Links isDirty />);

      expect(traverseTo('/sheet/lore')).toBe(false);
      expect(confirm).not.toHaveBeenCalled();
    });

    it('quando o navegador não deixa cancelar, nem pergunta', () => {
      const confirm = vi.spyOn(window, 'confirm');
      render(<Links isDirty />);

      traverseTo('/characters', { cancelable: false });

      expect(confirm).not.toHaveBeenCalled();
    });
  });

  it('pede confirmação ao fechar ou recarregar a aba', () => {
    render(<Links isDirty />);
    const event = new Event('beforeunload', { cancelable: true });

    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
  });
});

describe('useSaveShortcut', () => {
  it('Ctrl+S e Cmd+S salvam e não abrem o "salvar página" do navegador', () => {
    const onSave = vi.fn();
    renderHook(() => useSaveShortcut(onSave));

    const ctrl = fireEvent.keyDown(window, { key: 's', ctrlKey: true });
    fireEvent.keyDown(window, { key: 'S', metaKey: true });

    expect(onSave).toHaveBeenCalledTimes(2);
    expect(ctrl).toBe(false); // default prevented
  });

  it('desligado (null) deixa o atalho do navegador em paz', () => {
    renderHook(() => useSaveShortcut(null));

    expect(fireEvent.keyDown(window, { key: 's', ctrlKey: true })).toBe(true);
  });
});

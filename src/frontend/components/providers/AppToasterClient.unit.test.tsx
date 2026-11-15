import { act, fireEvent, screen, waitFor } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Dialog, DialogContent, DialogTitle } from '@frontend/components/ui/dialog';

import { AppToasterClient } from './AppToasterClient';

// Sonner captures the pointer to follow a swipe; jsdom has no pointer capture
Element.prototype.setPointerCapture ??= () => {};

function stubPhone(phone: boolean) {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: phone && query.includes('max-width'),
        media: query,
        addEventListener: () => {},
        removeEventListener: () => {},
      }) as unknown as MediaQueryList,
  );
}

/** A modal open over the page, and the app's toaster beside it (as in the root layout). */
async function renderWithModal() {
  const onOpenChange = vi.fn();
  renderWithProviders(
    <>
      <Dialog open onOpenChange={onOpenChange}>
        <DialogContent aria-describedby={undefined}>
          <DialogTitle>Spell search</DialogTitle>
        </DialogContent>
      </Dialog>
      <AppToasterClient label="Notifications" />
    </>,
  );
  const onUndo = vi.fn();
  act(() => {
    toast('Spell forgotten.', { action: { label: 'Undo', onClick: onUndo } });
  });
  // Not `hidden: true`: the Undo must be in the accessibility tree with the modal open
  const undo = await screen.findByRole('button', { name: 'Undo' });
  return { onOpenChange, onUndo, undo };
}

describe('AppToasterClient', () => {
  afterEach(() => {
    act(() => toast.dismiss());
    vi.restoreAllMocks();
  });

  it('com um modal aberto, tocar no toast não fecha o modal e o Desfazer funciona', async () => {
    stubPhone(false);
    const { onOpenChange, onUndo, undo } = await renderWithModal();
    // Radix starts listening for outside presses on the next tick
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    fireEvent.pointerDown(undo);
    fireEvent.click(undo);

    expect(onUndo).toHaveBeenCalledOnce();
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });

  it('um toque fora do modal e fora dos toasts ainda fecha o modal', async () => {
    stubPhone(false);
    const { onOpenChange } = await renderWithModal();
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));

    fireEvent.pointerDown(document.body);
    fireEvent.click(document.body);

    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });

  it('aceita cliques mesmo com o body sem pointer-events (o modal do Radix)', async () => {
    stubPhone(false);
    await renderWithModal();

    expect(document.querySelector('[data-sonner-toaster]')).toHaveClass('pointer-events-auto');
  });

  it('com um modal aberto, o leitor de tela ainda alcança os toasts', async () => {
    stubPhone(false);
    await renderWithModal();
    const region = screen.getByRole('region', { name: /Notifications/ });

    // What the modal does to the rest of the page (Radix's hideOthers)
    act(() => {
      region.setAttribute('aria-hidden', 'true');
      region.setAttribute('data-aria-hidden', 'true');
    });

    await waitFor(() => expect(region).not.toHaveAttribute('aria-hidden'));
    expect(region).not.toHaveAttribute('data-aria-hidden');
    expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
  });

  it('no celular fica no topo', async () => {
    stubPhone(true);
    renderWithProviders(<AppToasterClient label="Notifications" />);
    act(() => {
      toast('Saved');
    });

    await waitFor(() =>
      expect(document.querySelector('[data-sonner-toaster]')).toHaveAttribute(
        'data-y-position',
        'top',
      ),
    );
  });
});

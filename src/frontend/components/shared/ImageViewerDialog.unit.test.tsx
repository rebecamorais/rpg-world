import { useState } from 'react';

import { fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageViewerDialog } from './ImageViewerDialog';

const t = messages.avatarUpload;

function renderViewer(props: Partial<React.ComponentProps<typeof ImageViewerDialog>> = {}) {
  const onOpenChange = vi.fn();
  const element = (open: boolean) => (
    <ImageViewerDialog
      src="https://img.test/a.webp"
      alt="Lyra"
      open={open}
      onOpenChange={onOpenChange}
      {...props}
    />
  );
  const { rerender } = renderWithProviders(element(true));
  return { onOpenChange, setOpen: (open: boolean) => rerender(element(open)) };
}

const image = () => screen.getByRole('img', { name: 'Lyra' });
const stage = () => screen.getByRole('group', { name: t.viewTitle });
const button = (name: string) => screen.getByRole('button', { name });

describe('ImageViewerDialog', () => {
  beforeEach(() => {
    // jsdom has no layout
    vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(
      new DOMRect(0, 0, 400, 400),
    );
    Element.prototype.setPointerCapture = vi.fn();
  });

  afterEach(() => vi.restoreAllMocks());

  it('abre sem zoom', () => {
    renderViewer();

    expect(image().style.transform).toContain('scale(1)');
    expect(button(t.zoomOut)).toHaveAttribute('aria-disabled', 'true');
    expect(button(t.zoomFit)).toHaveAttribute('aria-disabled', 'true');
    expect(button(t.zoomIn)).toHaveAttribute('aria-disabled', 'false');
  });

  it('aproxima pelo botão e volta ao ajuste', async () => {
    renderViewer();

    await userEvent.click(button(t.zoomIn));
    expect(image().style.transform).toContain('scale(1.5)');

    await userEvent.click(button(t.zoomFit));
    expect(image().style.transform).toContain('scale(1)');
  });

  it('não passa de 5x', async () => {
    renderViewer();

    for (let i = 0; i < 8; i++) await userEvent.click(button(t.zoomIn));

    expect(image().style.transform).toContain('scale(5)');
    expect(button(t.zoomIn)).toHaveAttribute('aria-disabled', 'true');
  });

  it('aproxima pela roda do mouse', () => {
    renderViewer();

    fireEvent.wheel(stage(), { deltaY: -100, clientX: 200, clientY: 200 });

    expect(image().style.transform).not.toContain('scale(1)');
  });

  it('setas movem a imagem só quando há zoom', async () => {
    renderViewer();

    stage().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(image().style.transform).toContain('translate(0px, 0px)');

    await userEvent.click(button(t.zoomIn));
    stage().focus();
    await userEvent.keyboard('{ArrowRight}');
    expect(image().style.transform).toContain('translate(40px, 0px)');
  });

  it('arrastar move a imagem ampliada', async () => {
    renderViewer();
    await userEvent.click(button(t.zoomIn));

    fireEvent.pointerDown(stage(), { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 130, clientY: 90 });
    fireEvent.pointerUp(stage(), { pointerId: 1 });

    expect(image().style.transform).toContain('translate(30px, -10px)');
  });

  it('pinça com dois dedos aproxima', () => {
    renderViewer();

    fireEvent.pointerDown(stage(), { pointerId: 1, clientX: 150, clientY: 200 });
    fireEvent.pointerDown(stage(), { pointerId: 2, clientX: 250, clientY: 200 });
    fireEvent.pointerMove(stage(), { pointerId: 2, clientX: 350, clientY: 200 });

    expect(image().style.transform).toContain('scale(2)');
  });

  it('reabrir volta ao início', async () => {
    const { setOpen } = renderViewer();
    await userEvent.click(button(t.zoomIn));

    setOpen(false);
    setOpen(true);

    expect(image().style.transform).toContain('scale(1)');
  });

  it('sem onAdjust não mostra o botão de ajustar', () => {
    renderViewer();

    expect(screen.queryByRole('button', { name: t.adjust })).not.toBeInTheDocument();
  });

  it('com onAdjust fecha o modal e só então chama onAdjust', async () => {
    const onAdjust = vi.fn();
    function Harness() {
      const [open, setOpen] = useState(true);
      return (
        <ImageViewerDialog
          src="https://img.test/a.webp"
          alt="Lyra"
          open={open}
          onOpenChange={setOpen}
          onAdjust={onAdjust}
        />
      );
    }
    renderWithProviders(<Harness />);

    await userEvent.click(button(t.adjust));

    await waitFor(() => expect(onAdjust).toHaveBeenCalledOnce());
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('o botão no limite não perde o foco do teclado', async () => {
    renderViewer();
    await userEvent.click(button(t.zoomIn));

    await userEvent.click(button(t.zoomFit));

    expect(button(t.zoomFit)).toBeEnabled();
    expect(button(t.zoomFit)).toHaveFocus();
  });

  it('botão direito não arrasta a imagem', async () => {
    renderViewer();
    await userEvent.click(button(t.zoomIn));

    fireEvent.pointerDown(stage(), { pointerId: 1, button: 2, clientX: 100, clientY: 100 });
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 130, clientY: 90 });

    expect(image().style.transform).toContain('translate(0px, 0px)');
  });

  it('perder o ponteiro encerra o arrasto', async () => {
    renderViewer();
    await userEvent.click(button(t.zoomIn));

    fireEvent.pointerDown(stage(), { pointerId: 1, clientX: 100, clientY: 100 });
    fireEvent.lostPointerCapture(stage(), { pointerId: 1 });
    fireEvent.pointerMove(stage(), { pointerId: 1, clientX: 130, clientY: 90 });

    expect(image().style.transform).toContain('translate(0px, 0px)');
  });

  it('o botão de fechar tem fundo próprio, para o contraste não depender da imagem', () => {
    renderViewer();

    expect(screen.getByRole('dialog').className).toContain('[&>button]:bg-background');
  });

  it('fechar devolve o foco a quem abriu', async () => {
    function Harness() {
      const [open, setOpen] = useState(false);
      return (
        <>
          <button onClick={() => setOpen(true)}>abrir</button>
          <ImageViewerDialog
            src="https://img.test/a.webp"
            alt="Lyra"
            open={open}
            onOpenChange={setOpen}
          />
        </>
      );
    }
    renderWithProviders(<Harness />);

    await userEvent.click(button('abrir'));
    await userEvent.keyboard('{Escape}');

    await waitFor(() => expect(button('abrir')).toHaveFocus());
  });

  it('imagem com transparência fica sobre um fundo sólido, não sobre a página', () => {
    renderViewer();

    expect(stage().className).toContain('bg-background');
  });
});

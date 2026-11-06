import { fireEvent, screen } from '@testing-library/react';
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
    expect(button(t.zoomOut)).toBeDisabled();
    expect(button(t.zoomFit)).toBeDisabled();
    expect(button(t.zoomIn)).toBeEnabled();
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
    expect(button(t.zoomIn)).toBeDisabled();
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

  it('com onAdjust fecha o modal e chama onAdjust', async () => {
    const onAdjust = vi.fn();
    const { onOpenChange } = renderViewer({ onAdjust });

    await userEvent.click(button(t.adjust));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(onAdjust).toHaveBeenCalledOnce();
  });
});

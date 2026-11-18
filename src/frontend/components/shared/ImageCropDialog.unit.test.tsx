import { fireEvent, screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ImageCropDialog } from './ImageCropDialog';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

function renderCrop() {
  const onCancel = vi.fn();
  const onConfirm = vi.fn();
  renderWithProviders(
    <ImageCropDialog source="blob:picked" onCancel={onCancel} onConfirm={onConfirm} />,
  );
  return { onCancel, onConfirm };
}

describe('ImageCropDialog', () => {
  beforeEach(() => vi.clearAllMocks());

  it('um arquivo que não é imagem fecha o recorte na hora, com o aviso', () => {
    const { onCancel, onConfirm } = renderCrop();

    fireEvent.error(screen.getByRole('dialog').querySelector('img')!);

    expect(toast.error).toHaveBeenCalledWith(messages.common.errors.image_error_decode);
    expect(onCancel).toHaveBeenCalled();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('uma imagem que carrega não fecha nem avisa', () => {
    const { onCancel } = renderCrop();

    fireEvent.load(screen.getByRole('dialog').querySelector('img')!);

    expect(toast.error).not.toHaveBeenCalled();
    expect(onCancel).not.toHaveBeenCalled();
  });
});

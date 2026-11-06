import { act, waitFor } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cropImage } from '@frontend/lib/crop-image';
import { loadStoredImage } from '@frontend/lib/stored-image';

import { useImageCrop } from './useImageCrop';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@frontend/lib/crop-image', () => ({ cropImage: vi.fn() }));
vi.mock('@frontend/lib/stored-image', () => ({ loadStoredImage: vi.fn() }));

const SAVED = 'https://img.test/avatars/u/a.webp';
const cropped = new File(['small'], 'image.webp', { type: 'image/webp' });
const AREA = { x: 0, y: 0, width: 10, height: 10 };

function setup() {
  const upload = vi.fn(async () => ({ url: 'https://img.test/avatars/u/b.webp' }));
  const onUploaded = vi.fn();
  const onUploadError = vi.fn();
  const latest = {} as { crop: ReturnType<typeof useImageCrop> };

  function Harness() {
    latest.crop = useImageCrop({ upload, onUploaded, onUploadError });
    return null;
  }

  renderWithProviders(<Harness />);
  return { upload, onUploaded, onUploadError, latest };
}

describe('useImageCrop', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    URL.createObjectURL = vi.fn(() => 'blob:source');
    URL.revokeObjectURL = vi.fn();
    vi.mocked(cropImage).mockResolvedValue(cropped);
    vi.mocked(loadStoredImage).mockResolvedValue(new Blob(['img'], { type: 'image/webp' }));
  });

  afterEach(() => vi.restoreAllMocks());

  it('adjust abre o recorte com a imagem salva', async () => {
    const { latest } = setup();

    await act(() => latest.crop.adjust(SAVED));

    expect(loadStoredImage).toHaveBeenCalledWith(SAVED);
    expect(latest.crop.cropSource).toBe('blob:source');
    expect(latest.crop.isLoadingSource).toBe(false);
  });

  it('falha ao carregar não abre o recorte', async () => {
    vi.mocked(loadStoredImage).mockRejectedValue(new Error('stored_image_unavailable'));
    const { latest, onUploaded } = setup();

    await act(() => latest.crop.adjust(SAVED));

    expect(toast.error).toHaveBeenCalledWith(messages.avatarUpload.adjustLoadError);
    expect(latest.crop.cropSource).toBeNull();
    expect(onUploaded).not.toHaveBeenCalled();
  });

  it('cancelar não envia nada', async () => {
    const { latest, upload } = setup();
    await act(() => latest.crop.adjust(SAVED));

    act(() => latest.crop.cancel());

    expect(upload).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:source');
    expect(latest.crop.cropSource).toBeNull();
  });

  it('confirmar envia e avisa a nova URL', async () => {
    const { latest, upload, onUploaded } = setup();
    await act(() => latest.crop.adjust(SAVED));

    await act(() => latest.crop.confirm(AREA));

    expect(upload).toHaveBeenCalledWith(cropped);
    await waitFor(() =>
      expect(onUploaded).toHaveBeenCalledWith('https://img.test/avatars/u/b.webp'),
    );
  });

  it('falha no envio não avisa nova URL', async () => {
    const { latest, upload, onUploaded, onUploadError } = setup();
    const failure = new Error('nope');
    upload.mockRejectedValue(failure);
    await act(() => latest.crop.adjust(SAVED));

    await act(() => latest.crop.confirm(AREA));

    expect(onUploaded).not.toHaveBeenCalled();
    expect(onUploadError).toHaveBeenCalledWith(failure);
  });

  it('um segundo adjust enquanto carrega é ignorado', async () => {
    const { latest } = setup();

    await act(async () => {
      await Promise.all([latest.crop.adjust(SAVED), latest.crop.adjust(SAVED)]);
    });

    expect(loadStoredImage).toHaveBeenCalledOnce();
  });
});

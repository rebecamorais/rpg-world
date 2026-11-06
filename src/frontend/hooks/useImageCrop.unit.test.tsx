import { act, waitFor } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { cropImage, fullImage } from '@frontend/lib/crop-image';
import { loadStoredImage } from '@frontend/lib/stored-image';

import { useImageCrop } from './useImageCrop';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
vi.mock('@frontend/lib/crop-image', () => ({ cropImage: vi.fn(), fullImage: vi.fn() }));
vi.mock('@frontend/lib/stored-image', () => ({ loadStoredImage: vi.fn() }));

const SAVED = 'https://img.test/avatars/u/a.webp';
const cropped = new File(['small'], 'image.webp', { type: 'image/webp' });
const AREA = { x: 0, y: 0, width: 10, height: 10 };

function setup(keepFull = false) {
  const upload = vi.fn(async (_file: File, _full?: File) => ({
    url: 'https://img.test/avatars/u/b.webp',
  }));
  const onUploaded = vi.fn();
  const onUploadError = vi.fn();
  const latest = {} as { crop: ReturnType<typeof useImageCrop> };

  function Harness() {
    latest.crop = useImageCrop({ upload, onUploaded, onUploadError, keepFull });
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

    expect(upload).toHaveBeenCalledWith(cropped, undefined);
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

  describe('imagem completa', () => {
    const NEW_AVATAR = 'https://img.test/avatars/u/characters/c-v1-avatar.webp';
    const NEW_FULL = 'https://img.test/avatars/u/characters/c-v1.webp';
    const OLD_AVATAR = 'https://img.test/avatars/u/characters/c-v0.webp';
    const stored = new Blob(['whole'], { type: 'image/webp' });
    const generated = new File(['generated'], 'full.webp', { type: 'image/webp' });

    beforeEach(() => {
      vi.mocked(fullImage).mockResolvedValue(generated);
      vi.mocked(loadStoredImage).mockResolvedValue(stored);
    });

    it('arquivo novo envia o recorte e a completa gerada dele', async () => {
      const { latest, upload } = setup(true);
      const picked = new File(['picked'], 'art.png', { type: 'image/png' });
      act(() => latest.crop.pickFile(picked));

      await act(() => latest.crop.confirm(AREA));

      expect(fullImage).toHaveBeenCalledWith(picked);
      expect(upload).toHaveBeenCalledWith(cropped, generated);
    });

    it('sem keepFull não gera nem envia a completa', async () => {
      const { latest, upload } = setup();
      act(() => latest.crop.pickFile(new File(['picked'], 'art.png', { type: 'image/png' })));

      await act(() => latest.crop.confirm(AREA));

      expect(fullImage).not.toHaveBeenCalled();
      expect(upload).toHaveBeenCalledWith(cropped, undefined);
    });

    it('ajuste lê a completa e reenvia sem recodificar', async () => {
      const { latest, upload } = setup(true);

      await act(() => latest.crop.adjust(NEW_AVATAR));
      await act(() => latest.crop.confirm(AREA));

      expect(loadStoredImage).toHaveBeenCalledWith(NEW_FULL);
      expect(fullImage).not.toHaveBeenCalled();
      const sent = upload.mock.calls[0][1]!;
      expect(sent.type).toBe('image/webp');
      expect(await sent.text()).toBe('whole');
    });

    it('ajuste em outro formato recodifica a completa', async () => {
      vi.mocked(cropImage).mockResolvedValue(
        new File(['small'], 'image.jpg', { type: 'image/jpeg' }),
      );
      const { latest, upload } = setup(true);

      await act(() => latest.crop.adjust(NEW_AVATAR));
      await act(() => latest.crop.confirm(AREA));

      expect(fullImage).toHaveBeenCalledWith(stored);
      expect(upload.mock.calls[0][1]).toBe(generated);
    });

    it('falha ao ler a completa avisa e não abre o recorte com o avatar', async () => {
      vi.mocked(loadStoredImage).mockRejectedValueOnce(new Error('falha momentânea'));
      const { latest, upload } = setup(true);

      await act(() => latest.crop.adjust(NEW_AVATAR));

      expect(vi.mocked(loadStoredImage).mock.calls.map(([url]) => url)).toEqual([NEW_FULL]);
      expect(toast.error).toHaveBeenCalledWith(messages.avatarUpload.adjustLoadError);
      expect(latest.crop.cropSource).toBeNull();
      expect(upload).not.toHaveBeenCalled();
    });

    it('imagem antiga não tenta a completa', async () => {
      const { latest, upload } = setup(true);

      await act(() => latest.crop.adjust(OLD_AVATAR));
      await act(() => latest.crop.confirm(AREA));

      expect(vi.mocked(loadStoredImage).mock.calls.map(([url]) => url)).toEqual([OLD_AVATAR]);
      expect(upload).toHaveBeenCalledWith(cropped, undefined);
    });
  });
});

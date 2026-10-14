import { waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { FileUploaderProvider } from '@frontend/context/FileUploaderContext';

import ImageUpload from './ImageUpload';

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));

const fetchMock = vi.fn();
const png = () => new File(['img'], 'avatar.png', { type: 'image/png' });

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status });
}

function renderUpload(props: Partial<React.ComponentProps<typeof ImageUpload>> = {}) {
  const onUploadSuccess = vi.fn();
  const onUploadError = vi.fn();
  renderWithProviders(
    <FileUploaderProvider>
      <ImageUpload
        target="profile"
        onUploadSuccess={onUploadSuccess}
        onUploadError={onUploadError}
        {...props}
      />
    </FileUploaderProvider>,
  );
  const input = document.querySelector<HTMLInputElement>('input[type="file"]')!;
  return { onUploadSuccess, onUploadError, input };
}

describe('ImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', fetchMock);
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    fetchMock.mockImplementation(async () => json({ url: 'https://img.test/a.png' }));
  });

  afterEach(() => vi.unstubAllGlobals());

  it('envia o arquivo para o endpoint do perfil e devolve a URL', async () => {
    const { input, onUploadSuccess } = renderUpload();

    await userEvent.upload(input, png());

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledWith('https://img.test/a.png'));
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/profile/avatar');
    expect((init.body as FormData).get('file')).toBeInstanceOf(File);
  });

  it('usa o endpoint do personagem quando o alvo é um personagem', async () => {
    const { input } = renderUpload({ target: 'character', targetId: 'c1' });

    await userEvent.upload(input, png());

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(fetchMock.mock.calls[0][0]).toBe('/api/characters/c1/avatar');
  });

  it('aceita o mesmo arquivo de novo (ex.: tentar outra vez depois de uma falha)', async () => {
    const { input, onUploadSuccess } = renderUpload();
    const file = png();

    await userEvent.upload(input, file);
    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(1));
    await userEvent.upload(input, file);

    await waitFor(() => expect(onUploadSuccess).toHaveBeenCalledTimes(2));
  });

  it('mostra o erro traduzido e descarta a prévia quando o envio falha', async () => {
    fetchMock.mockResolvedValue(json({ error: 'storage_error_upload_avatar_size_limit' }, 400));
    const { input, onUploadError, onUploadSuccess } = renderUpload({
      currentUrl: 'https://img.test/old.png',
    });

    await userEvent.upload(input, png());

    await waitFor(() => expect(onUploadError).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalledWith(
      messages.common.errors.storage_error_upload_avatar_size_limit,
    );
    expect(onUploadSuccess).not.toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});

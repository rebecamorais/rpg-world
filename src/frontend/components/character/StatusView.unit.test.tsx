import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { SaveCharacterButton } from '@frontend/components/character/sheet/SaveControls';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import StatusView from './StatusView';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({
  useParams: () => params.value,
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// jsdom has no canvas: the crop itself is covered in crop-image.unit.test.ts
vi.mock('@frontend/lib/crop-image', () => ({
  cropImage: vi.fn(async () => new File(['small'], 'image.webp', { type: 'image/webp' })),
}));

const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' };
const SAVED_AVATAR = 'https://img.test/avatars/u/a.webp';
const NEW_AVATAR = 'https://img.test/avatars/u/b.webp';
const tImage = messages.avatarUpload;

function renderStatus(sheet = character) {
  return renderWithCharacter(
    <>
      <SaveCharacterButton />
      <StatusView />
    </>,
    sheet,
  );
}

describe('StatusView', () => {
  it('na ficha do dono os campos são editáveis e há botão salvar', () => {
    params.value = { id: 'c1' };
    renderStatus();

    expect(screen.getByLabelText('AC')).toBeEnabled();
    expect(screen.getByRole('button', { name: messages.common.saveChanges })).toBeInTheDocument();
  });

  it('em modo só leitura não tem campo editável habilitado nem botão salvar', () => {
    params.value = { partyId: 'p1', id: 'c1' };
    renderStatus();

    const fields = [...screen.queryAllByRole('textbox'), ...screen.queryAllByRole('spinbutton')];
    expect(fields.length).toBeGreaterThan(0);
    for (const field of fields) expect(field).toBeDisabled();
    expect(
      screen.queryByRole('button', { name: messages.common.saveChanges }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: messages.characterHeader.customizeTitle }),
    ).not.toBeInTheDocument();
  });

  describe('ajustar a imagem', () => {
    const withAvatar = { ...character, avatarUrl: SAVED_AVATAR };

    beforeEach(() => {
      URL.createObjectURL = vi.fn(() => 'blob:source');
      URL.revokeObjectURL = vi.fn();
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string) =>
          input.startsWith('/api/images/')
            ? new Response(new Blob(['img']), { headers: { 'Content-Type': 'image/webp' } })
            : new Response(JSON.stringify({ url: NEW_AVATAR })),
        ),
      );
    });

    afterEach(() => vi.unstubAllGlobals());

    it('o dono ajusta pelo cabeçalho e só a imagem muda no rascunho', async () => {
      params.value = { id: 'c1' };
      const { draft, save } = renderStatus(withAvatar);
      await userEvent.type(screen.getByLabelText(messages.characterHeader.name), ' II');

      await userEvent.click(screen.getByRole('button', { name: tImage.view }));
      await userEvent.click(screen.getByRole('button', { name: tImage.adjust }));
      await userEvent.click(await screen.findByRole('button', { name: tImage.save }));

      await waitFor(() => expect(draft().avatarUrl).toBe(NEW_AVATAR));
      expect(draft().name).toBe('Thor II');
      expect(save).not.toHaveBeenCalled();
    });

    it('mostra que está atualizando enquanto envia a imagem ajustada', async () => {
      params.value = { id: 'c1' };
      let finishUpload = () => {};
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string) => {
          if (input.startsWith('/api/images/')) {
            return new Response(new Blob(['img']), { headers: { 'Content-Type': 'image/webp' } });
          }
          await new Promise<void>((resolve) => (finishUpload = resolve));
          return new Response(JSON.stringify({ url: NEW_AVATAR }));
        }),
      );
      const { draft } = renderStatus(withAvatar);

      await userEvent.click(screen.getByRole('button', { name: tImage.view }));
      await userEvent.click(screen.getByRole('button', { name: tImage.adjust }));
      await userEvent.click(await screen.findByRole('button', { name: tImage.save }));

      expect(await screen.findByText(tImage.adjusting)).toBeInTheDocument();

      finishUpload();
      await waitFor(() => expect(draft().avatarUrl).toBe(NEW_AVATAR));
      expect(screen.queryByText(tImage.adjusting)).not.toBeInTheDocument();
    });

    it('cancelar o recorte devolve o foco ao botão de ver imagem', async () => {
      params.value = { id: 'c1' };
      renderStatus(withAvatar);
      const view = screen.getByRole('button', { name: tImage.view });

      await userEvent.click(view);
      await userEvent.click(screen.getByRole('button', { name: tImage.adjust }));
      await userEvent.click(await screen.findByRole('button', { name: messages.common.cancel }));

      await waitFor(() => expect(view).toHaveFocus());
    });

    it('o mestre vê a imagem, mas não pode ajustar', async () => {
      params.value = { partyId: 'p1', id: 'c1' };
      renderStatus(withAvatar);

      await userEvent.click(screen.getByRole('button', { name: tImage.view }));

      expect(screen.getByRole('button', { name: tImage.zoomIn })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: tImage.adjust })).not.toBeInTheDocument();
    });
  });
});

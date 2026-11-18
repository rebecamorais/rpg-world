import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { toast } from 'sonner';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { AppearanceTab } from './AppearanceTab';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'c1' }),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('sonner', () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
// jsdom has no canvas: the crop itself is covered in crop-image.unit.test.ts
vi.mock('@frontend/lib/crop-image', () => ({
  cropImage: vi.fn(async () => new File(['small'], 'image.webp', { type: 'image/webp' })),
  fullImage: vi.fn(async () => new File(['whole'], 'full.webp', { type: 'image/webp' })),
}));

const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' };
const UPLOADED = 'https://img.test/avatars/owner/characters/c1-v1-avatar.webp';

describe('AppearanceTab', () => {
  it('a página se chama Configurar ficha e tem a seção de recursos de classe', () => {
    const { container } = renderWithCharacter(<AppearanceTab />, character);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      messages.characterAppearance.title,
    );
    const section = container.querySelector('#class-resources');
    expect(section).toHaveTextContent(messages.sheetSettings.classResourcesTitle);
  });

  it('escolher 2024 grava a edição no rascunho', async () => {
    const { draft } = renderWithCharacter(<AppearanceTab />, character);

    await userEvent
      .setup()
      .click(screen.getByRole('radio', { name: messages.sheetSettings.edition2024 }));

    expect(draft().edition).toBe('2024');
    expect(screen.getByRole('radio', { name: messages.sheetSettings.edition2024 })).toBeChecked();
  });

  it('sem edição definida na ficha, nenhuma opção de edição vem marcada', () => {
    renderWithCharacter(<AppearanceTab />, { ...character, edition: undefined });

    for (const radio of screen.getAllByRole('radio', { name: /20(14|24)/ })) {
      expect(radio).not.toBeChecked();
    }
  });

  describe('imagem do personagem', () => {
    const t = messages.avatarUpload;

    afterEach(() => vi.unstubAllGlobals());

    it('grava na hora ao confirmar o recorte, sem passar pelo rascunho', async () => {
      vi.stubGlobal(
        'fetch',
        vi.fn(async () => new Response(JSON.stringify({ url: UPLOADED }))),
      );
      URL.createObjectURL = vi.fn(() => 'blob:preview');
      URL.revokeObjectURL = vi.fn();
      const user = userEvent.setup();
      const { saveNow, sentNow, isDirty } = renderWithCharacter(<AppearanceTab />, character);

      await user.upload(
        screen.getByTestId('image-upload-input'),
        new File(['img'], 'art.png', { type: 'image/png' }),
      );
      await user.click(
        within(await screen.findByRole('dialog')).getByRole('button', { name: t.save }),
      );

      await waitFor(() => expect(saveNow).toHaveBeenCalled());
      expect(sentNow()).toEqual({ avatarUrl: UPLOADED });
      expect(isDirty()).toBe(false);
      await waitFor(() => expect(toast.success).toHaveBeenCalledWith(t.saved));
    });

    it('remover pede confirmação e grava na hora', async () => {
      const user = userEvent.setup();
      const { saveNow, sentNow } = renderWithCharacter(<AppearanceTab />, {
        ...character,
        avatarUrl: 'https://img.test/avatars/owner/characters/c1-v0.webp',
      });

      await user.click(screen.getByRole('button', { name: t.remove }));
      expect(saveNow).not.toHaveBeenCalled();
      await user.click(
        within(await screen.findByRole('alertdialog')).getByRole('button', { name: t.remove }),
      );

      await waitFor(() => expect(saveNow).toHaveBeenCalled());
      expect(sentNow()).toEqual({ avatarUrl: '' });
    });
  });
});

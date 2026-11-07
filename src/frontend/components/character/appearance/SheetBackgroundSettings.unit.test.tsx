import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useLoadedCharacter } from '@frontend/context/CharacterContext';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { SheetBackgroundSettings } from './SheetBackgroundSettings';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'c1' }),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

// jsdom has no canvas: the encoding is covered in crop-image.unit.test.ts
vi.mock('@frontend/lib/crop-image', () => ({
  fullImage: vi.fn(async () => new File(['small'], 'image.webp', { type: 'image/webp' })),
}));

const t = messages.characterAppearance;
const SAVED = 'https://img.test/avatars/u/characters/c1-background-v1.webp';
const NEW = 'https://img.test/avatars/u/characters/c1-background-v2.webp';

function Draft() {
  return <output>{useLoadedCharacter().sheetBackgroundUrl || 'none'}</output>;
}

function renderSettings(sheetBackgroundUrl?: string) {
  const user = userEvent.setup();
  const { container } = renderWithCharacter(
    <>
      <SheetBackgroundSettings />
      <Draft />
    </>,
    { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1', sheetBackgroundUrl },
  );
  const input = container.querySelector<HTMLInputElement>('#sheet-background-input')!;
  return { user, input };
}

describe('SheetBackgroundSettings', () => {
  beforeEach(() => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ url: NEW }), { status: 200 })),
    );
  });

  afterEach(() => vi.unstubAllGlobals());

  it('envia a imagem e leva a URL para o rascunho', async () => {
    const { user, input } = renderSettings();

    await user.upload(input, new File(['art'], 'art.png', { type: 'image/png' }));

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(NEW));
    expect(fetch).toHaveBeenCalledWith(
      '/api/characters/c1/sheet-background',
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('sem fundo, só oferece adicionar', () => {
    renderSettings();

    expect(screen.getByRole('button', { name: t.backgroundAdd })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: t.backgroundRemove })).not.toBeInTheDocument();
  });

  it('remover limpa o fundo do rascunho', async () => {
    const { user } = renderSettings(SAVED);

    await user.click(screen.getByRole('button', { name: t.backgroundRemove }));

    expect(screen.getByRole('status')).toHaveTextContent('none');
    expect(screen.getByRole('button', { name: t.backgroundAdd })).toBeInTheDocument();
  });

  it('se o envio falhar, o fundo atual continua', async () => {
    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: 'nope' }), { status: 500 }),
    );
    const { user, input } = renderSettings(SAVED);

    await user.upload(input, new File(['art'], 'art.png', { type: 'image/png' }));

    await screen.findByRole('button', { name: t.backgroundReplace });
    expect(screen.getByRole('status')).toHaveTextContent(SAVED);
  });
});

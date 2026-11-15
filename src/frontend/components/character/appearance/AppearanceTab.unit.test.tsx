import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { AppearanceTab } from './AppearanceTab';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'c1' }),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' };

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
});

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { useLoadedCharacter } from '@frontend/context/CharacterContext';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import { AccentColorPicker } from './AccentColorPicker';

vi.mock('next/navigation', () => ({
  useParams: () => ({ id: 'c1' }),
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const t = messages.characterAppearance;
const tColors = messages.profileForm.colors;

function Saved() {
  return <output>{useLoadedCharacter().accentColor}</output>;
}

function renderPicker(accentColor = '') {
  const user = userEvent.setup();
  renderWithCharacter(
    <>
      <AccentColorPicker />
      <Saved />
    </>,
    { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1', accentColor },
  );
  return user;
}

const draftColor = () => screen.getByRole('status');
const code = () => screen.getByLabelText(t.colorCode);

describe('AccentColorPicker', () => {
  it('uma cor do sistema vai para o rascunho e fica marcada', async () => {
    const user = renderPicker();

    await user.click(screen.getByRole('button', { name: tColors.blue }));

    expect(draftColor()).toHaveTextContent('#3b82f6');
    expect(screen.getByRole('button', { name: tColors.blue })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(code()).toHaveValue('#3b82f6');
  });

  it('a cor padrão fica marcada em quem não escolheu nenhuma', () => {
    renderPicker();

    expect(screen.getByRole('button', { name: tColors.default })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('um código válido muda a cor, com ou sem #', async () => {
    const user = renderPicker();

    await user.type(code(), 'C2410C');

    expect(draftColor()).toHaveTextContent('#c2410c');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('um código incompleto avisa e mantém a cor atual', async () => {
    const user = renderPicker('#3b82f6');

    await user.clear(code());
    await user.type(code(), '#zz');

    expect(draftColor()).toHaveTextContent('#3b82f6');
    expect(screen.getByRole('alert')).toHaveTextContent(t.colorCodeInvalid);
    expect(code()).toHaveAttribute('aria-invalid', 'true');
  });

  it('o seletor do navegador recebe sempre seis dígitos', () => {
    renderPicker('#abc');

    expect(screen.getByLabelText(t.anyColor)).toHaveValue('#aabbcc');
  });
});

import { screen } from '@testing-library/react';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { SaveCharacterButton } from '@frontend/components/character/sheet/SaveControls';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';

import StatusView from './StatusView';

const params = vi.hoisted(() => ({ value: {} as Record<string, string> }));
vi.mock('next/navigation', () => ({
  useParams: () => params.value,
  usePathname: () => '/',
  useRouter: () => ({ push: vi.fn() }),
}));

const character = { ...createDnD5eCharacter('owner', 'Thor'), id: 'c1' };

function renderStatus() {
  return renderWithCharacter(
    <>
      <SaveCharacterButton />
      <StatusView />
    </>,
    character,
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
});

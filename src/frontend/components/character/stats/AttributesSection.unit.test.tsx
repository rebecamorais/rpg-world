import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { messages } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import AttributesSection from './AttributesSection';

const character = {
  ...createDnD5eCharacter('owner', 'Thor'),
  id: 'c1',
  attributes: { STR: 11, DEX: 10, CON: 10, INT: 10, WIS: 10, CHA: 10 },
} as DnD5eCharacter;

const t = messages.attributes;

async function openEditAll() {
  await userEvent.click(screen.getByRole('button', { name: t.bulkEditTitle }));
  return screen.getByRole('dialog');
}

describe('AttributesSection: editar todos', () => {
  it('diz "Aplicar" e avisa que entra no rascunho da ficha', async () => {
    const { draft, isDirty } = renderWithCharacter(<AttributesSection />, character);
    const dialog = await openEditAll();

    expect(within(dialog).queryByRole('button', { name: t.save })).not.toBeInTheDocument();
    expect(within(dialog).getByText(messages.common.draftNote)).toBeInTheDocument();

    await userEvent.clear(within(dialog).getByLabelText(t.STR));
    await userEvent.type(within(dialog).getByLabelText(t.STR), '14');
    await userEvent.click(within(dialog).getByRole('button', { name: messages.common.apply }));

    expect(draft().attributes.STR).toBe(14);
    expect(isDirty()).toBe(true);
  });

  it('o limite (1 a 30) fica à vista', async () => {
    renderWithCharacter(<AttributesSection />, character);
    const dialog = await openEditAll();

    const description = within(dialog).getByText(t.bulkEditDescription);
    expect(description).not.toHaveClass('sr-only');
    expect(t.bulkEditDescription).toMatch(/1 to 30/);
  });

  it('ordena por colunas, como o card da ficha (FOR DES CON, depois INT SAB CAR)', async () => {
    renderWithCharacter(<AttributesSection />, character);
    const dialog = await openEditAll();

    const grid = within(dialog).getByLabelText(t.STR).closest('.grid');
    expect(grid).toHaveClass('grid-flow-col', 'grid-rows-3');
  });
});

describe('AttributeCard: editar um', () => {
  it('mostra a fórmula em palavras, arredondada para baixo, e não o código', async () => {
    renderWithCharacter(<AttributesSection />, character);
    const card = screen.getByRole('button', { name: /STR/ });
    // 11 is +0 on the sheet, as the formula says
    expect(card).toHaveTextContent('+0');
    await userEvent.click(card);
    const dialog = screen.getByRole('dialog');

    expect(within(dialog).getByText(messages.attributeCard.modifierFormula)).toBeInTheDocument();
    expect(within(dialog).queryByText(/attributeModifier|round\(/)).not.toBeInTheDocument();
  });
});

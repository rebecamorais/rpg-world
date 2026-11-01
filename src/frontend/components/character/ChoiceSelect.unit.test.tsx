import { useState } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { ChoiceSelect } from './ChoiceSelect';

const OPTIONS = [
  { value: 'elf', label: 'Elf', icon: 'woman-elf-face' },
  { value: 'human', label: 'Human', icon: 'person' },
];
// A stand-in for useCharacterChoices().raceOf
const matchOf = (text: string) =>
  OPTIONS.find((o) => o.value === text || o.label.toLowerCase() === text.toLowerCase())?.value ??
  null;

/** The field with its value kept, as the sheet does. */
function Field({
  initial = '',
  onChange = vi.fn(),
}: {
  initial?: string;
  onChange?: (v: string) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ChoiceSelect
      id="race"
      label="Race"
      value={value}
      matched={matchOf(value)}
      options={OPTIONS}
      placeholder="Pick a race"
      otherLabel="Other…"
      otherPlaceholder="Race name"
      maxLength={100}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    />
  );
}

describe('ChoiceSelect', () => {
  it('uma raça da lista é salva pelo id', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Field onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Race' }));
    await userEvent.click(screen.getByRole('option', { name: 'Elf' }));

    expect(onChange).toHaveBeenLastCalledWith('elf');
    expect(screen.getByRole('combobox', { name: 'Race' })).toHaveTextContent('Elf');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('"Outro…" abre um campo para o nome do jogador, vazio, e salva o que ele digita', async () => {
    const onChange = vi.fn();
    renderWithProviders(<Field initial="elf" onChange={onChange} />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Race' }));
    await userEvent.click(screen.getByRole('option', { name: 'Other…' }));
    const own = screen.getByRole('textbox', { name: 'Race name' });
    expect(own).toHaveValue('');
    // Typing right away goes into it, not back to the list's button
    expect(own).toHaveFocus();

    await userEvent.type(own, 'Aasimar');
    expect(onChange).toHaveBeenLastCalledWith('Aasimar');
    expect(screen.getByRole('combobox', { name: 'Race' })).toHaveTextContent('Other…');
  });

  it('um nome próprio já salvo abre em "Outro…" com o texto', () => {
    renderWithProviders(<Field initial="Aasimar" />);
    expect(screen.getByRole('textbox', { name: 'Race name' })).toHaveValue('Aasimar');
  });

  it('o texto livre de antes da lista ainda aparece escolhido', () => {
    renderWithProviders(<Field initial="Human" />);
    expect(screen.getByRole('combobox', { name: 'Race' })).toHaveTextContent('Human');
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });
});

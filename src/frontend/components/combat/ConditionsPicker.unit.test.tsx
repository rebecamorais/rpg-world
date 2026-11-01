import { useState } from 'react';

import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import type { ActiveCondition } from '@backend/contexts/combat/domain/Encounter';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import { ConditionsPicker } from './ConditionsPicker';

const c = (
  edition: string,
  book: string,
  id: string,
  name: string,
  maxLevel: number | null = null,
) => ({
  key: `dnd5e:${book}:condition:${id}`,
  id,
  edition,
  name,
  description: `${name}.`,
  maxLevel,
});
const CONDITIONS = [
  c('2024', 'srd-5.2', 'prone', 'Caído'),
  c('2024', 'srd-5.2', 'exhaustion', 'Exaustão', 6),
  c('2014', 'srd-5.1', 'blinded', 'Cego'),
];

vi.mock('@frontend/hooks/useConditions', () => ({
  useConditions: () => ({
    list: CONDITIONS,
    byKey: new Map(CONDITIONS.map((x) => [x.key, x])),
    isLoading: false,
  }),
}));

const PRONE = { key: 'dnd5e:srd-5.2:condition:prone', level: null };
const EXHAUSTION = 'dnd5e:srd-5.2:condition:exhaustion';

/** Keeps the value like the combat does, and records every call. */
function Harness({
  initial = [],
  defaultEdition = '2024',
  onChange,
}: {
  initial?: ActiveCondition[];
  defaultEdition?: Edition;
  onChange: (next: ActiveCondition[]) => void;
}) {
  const [value, setValue] = useState(initial);
  return (
    <ConditionsPicker
      value={value}
      defaultEdition={defaultEdition}
      onChange={(next) => {
        setValue(next);
        onChange(next);
      }}
    >
      <button type="button">abrir</button>
    </ConditionsPicker>
  );
}

const open = async (props: Parameters<typeof Harness>[0]) => {
  const user = userEvent.setup();
  renderWithProviders(<Harness {...props} />);
  await user.click(screen.getByRole('button', { name: 'abrir' }));
  return user;
};

describe('ConditionsPicker', () => {
  it('abre na aba da edição padrão', async () => {
    await open({ onChange: vi.fn() });
    expect(screen.getByRole('tab', { name: '2024' })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('switch', { name: 'Caído' })).toBeInTheDocument();
    expect(screen.queryByRole('switch', { name: 'Cego' })).not.toBeInTheDocument();
  });

  it('ligar "Caído" manda a lista com ele', async () => {
    const onChange = vi.fn();
    const user = await open({ onChange });
    await user.click(screen.getByRole('switch', { name: 'Caído' }));
    expect(onChange).toHaveBeenCalledWith([PRONE]);
    expect(screen.getByRole('switch', { name: 'Caído' })).toBeChecked();
  });

  it('desligar tira da lista', async () => {
    const onChange = vi.fn();
    const user = await open({ initial: [PRONE], onChange });
    await user.click(screen.getByRole('switch', { name: 'Caído' }));
    expect(onChange).toHaveBeenCalledWith([]);
  });

  it('a exaustão começa no nível 1 e o stepper sobe', async () => {
    const onChange = vi.fn();
    const user = await open({ onChange });
    await user.click(screen.getByRole('switch', { name: 'Exaustão' }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: EXHAUSTION, level: 1 }]);

    await user.click(screen.getByRole('button', { name: /Increase/ }));
    expect(onChange).toHaveBeenLastCalledWith([{ key: EXHAUSTION, level: 2 }]);
  });

  it('ligar na outra edição mantém as condições já ligadas', async () => {
    const onChange = vi.fn();
    const user = await open({ initial: [PRONE], onChange });
    await user.click(screen.getByRole('tab', { name: '2014' }));
    await user.click(screen.getByRole('switch', { name: 'Cego' }));
    expect(onChange).toHaveBeenCalledWith([
      PRONE,
      { key: 'dnd5e:srd-5.1:condition:blinded', level: null },
    ]);
  });

  it('cada linha tem a dica da regra', async () => {
    await open({ onChange: vi.fn() });
    expect(screen.getByRole('button', { name: 'Caído, condition' })).toBeInTheDocument();
  });
});

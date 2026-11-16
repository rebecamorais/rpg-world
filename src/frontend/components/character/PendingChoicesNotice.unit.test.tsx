import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithCharacter } from '@tests/helpers/character';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it, vi } from 'vitest';

import { useCharacterActions } from '@frontend/context/CharacterContext';
import { SheetSourceContext } from '@frontend/hooks/useSheetSource';

import type { ClassData } from '@shared/systems/dnd5e/content/class.schema';
import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { DnD5eCharacter } from '@shared/systems/dnd5e/types';

import { PendingChoicesNotice } from './PendingChoicesNotice';

const classes = JSON.parse(
  readFileSync(join(process.cwd(), 'content/dnd5e/srd-5.1/classes.json'), 'utf8'),
) as ClassData[];

vi.mock('@frontend/hooks/useClassResources', () => ({
  // The class as the content API sends it, with what the picks read
  useClassResources: (edition: string | undefined, classId: string | null) => {
    const data = edition && classId ? classes.find((c) => c.id === classId) : undefined;
    return { content: data ? { ...data, classId, edition } : null };
  },
}));

vi.mock('@frontend/hooks/useItems', () => ({
  useItems: () => ({
    list: [
      { id: 'lute', edition: '2014', category: 'instrument', name: 'Lute' },
      { id: 'flute', edition: '2014', category: 'instrument', name: 'Flute' },
      { id: 'drum', edition: '2014', category: 'instrument', name: 'Drum' },
    ],
  }),
}));

const base = createDnD5eCharacter('o', 'x');

/** Changes the class in the draft, as the sheet's header does. */
function SwitchClass() {
  const { update } = useCharacterActions();
  return (
    <>
      <button type="button" onClick={() => update({ class: 'rogue' })}>
        to rogue
      </button>
      <button type="button" onClick={() => update({ class: 'bard' })}>
        to bard
      </button>
    </>
  );
}

function renderNotice(extra: Partial<DnD5eCharacter> = {}) {
  const character = {
    ...base,
    id: 'c1',
    level: 1,
    class: 'bard',
    edition: '2014',
    ...extra,
  } as DnD5eCharacter;
  return renderWithCharacter(
    <>
      <PendingChoicesNotice />
      <SwitchClass />
    </>,
    character,
  );
}

const notice = () => screen.queryByRole('region', { name: 'Class picks left open' });
const row = (choice: 'Skills' | 'Tools') =>
  screen.getByRole('button', { name: `Resolve: ${choice}` }).closest('li')!;

const BARD_2_OF_3 = {
  classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY'] },
  skills: { ARCANA: { isProficient: true }, HISTORY: { isProficient: true } },
};

describe('PendingChoicesNotice', () => {
  it('criado com 2 de 3 perícias: 1 pendente, e as ferramentas todas em aberto', () => {
    renderNotice(BARD_2_OF_3);

    expect(notice()).toHaveTextContent('Bard still has picks to make');
    expect(row('Skills')).toHaveTextContent('2 of 3 picked');
    expect(row('Tools')).toHaveTextContent('0 of 3 picked');
  });

  it('resolver abre o seletor da criação com as já escolhidas; concluir zera a pendência', async () => {
    const { draft } = renderNotice(BARD_2_OF_3);

    await userEvent.click(screen.getByRole('button', { name: 'Resolve: Skills' }));
    const dialog = screen.getByRole('dialog', { name: 'Bard: Skills' });
    expect(within(dialog).getByRole('checkbox', { name: 'Arcana' })).toBeChecked();
    expect(within(dialog).getByRole('checkbox', { name: 'History' })).toBeChecked();
    expect(within(dialog).getByText('2 of 3')).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Stealth' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(draft().classChoices).toEqual({ '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] });
    // Marked proficient, as on creation
    expect(draft().skills.STEALTH).toEqual({ isProficient: true });
    expect(screen.queryByRole('button', { name: 'Resolve: Skills' })).not.toBeInTheDocument();
    // The tools are still open: the notice stays
    expect(notice()).toBeInTheDocument();
  });

  it('resolvendo ferramentas: guarda pela identidade da escolha, sem mexer nas perícias', async () => {
    const { draft } = renderNotice(BARD_2_OF_3);

    await userEvent.click(screen.getByRole('button', { name: 'Resolve: Tools' }));
    const dialog = screen.getByRole('dialog', { name: 'Bard: Tools' });
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Lute' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }));

    expect(draft().classChoices).toEqual({
      '2014/bard/skills': ['ARCANA', 'HISTORY'],
      '2014/bard/tools': ['lute'],
    });
    expect(draft().skills).toEqual(BARD_2_OF_3.skills);
    expect(row('Tools')).toHaveTextContent('1 of 3 picked');
  });

  it('cancelar deixa a ficha como estava', async () => {
    const { draft, isDirty } = renderNotice(BARD_2_OF_3);

    await userEvent.click(screen.getByRole('button', { name: 'Resolve: Skills' }));
    const dialog = screen.getByRole('dialog');
    await userEvent.click(within(dialog).getByRole('checkbox', { name: 'Stealth' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(draft().classChoices).toEqual(BARD_2_OF_3.classChoices);
    expect(isDirty()).toBe(false);
    expect(row('Skills')).toHaveTextContent('2 of 3 picked');
  });

  it('dispensar some com ela e não volta; a outra da classe continua', async () => {
    const { draft } = renderNotice(BARD_2_OF_3);

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Tools' }));

    expect(draft().dismissedChoices).toEqual(['2014/bard/tools']);
    expect(screen.queryByRole('button', { name: 'Resolve: Tools' })).not.toBeInTheDocument();
    expect(row('Skills')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Skills' }));

    expect(notice()).not.toBeInTheDocument();
    expect(draft().dismissedChoices).toEqual(['2014/bard/tools', '2014/bard/skills']);
  });

  it('não some sozinho: sem resolver nem dispensar, continua lá', async () => {
    renderNotice(BARD_2_OF_3);

    await userEvent.click(screen.getByRole('button', { name: 'to rogue' }));
    await userEvent.click(screen.getByRole('button', { name: 'to bard' }));

    expect(row('Skills')).toHaveTextContent('2 of 3 picked');
  });

  it('Bardo com as 3 → Ladino: as perícias do Bardo continuam marcadas e as 4 do Ladino em aberto', async () => {
    const skills = {
      ARCANA: { isProficient: true },
      HISTORY: { isProficient: true },
      STEALTH: { isProficient: true },
    };
    const { draft } = renderNotice({
      classChoices: { '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'] },
      dismissedChoices: ['2014/bard/tools'],
      skills,
    });
    expect(notice()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'to rogue' }));

    expect(notice()).toHaveTextContent('Rogue still has picks to make');
    expect(row('Skills')).toHaveTextContent('0 of 4 picked');
    expect(draft().skills).toEqual(skills);
    expect(draft().classChoices).toEqual({
      '2014/bard/skills': ['ARCANA', 'HISTORY', 'STEALTH'],
    });

    // Back to the Bard: the picks were never dropped
    await userEvent.click(screen.getByRole('button', { name: 'to bard' }));
    expect(notice()).not.toBeInTheDocument();
  });

  it('perícia marcada à mão, fora da escolha, não reduz a pendência', () => {
    renderNotice({ class: 'rogue', skills: { STEALTH: { isProficient: true } } });

    expect(row('Skills')).toHaveTextContent('0 of 4 picked');
  });

  it('dispensar no Bardo e trocar para Ladino: a do Ladino aparece; de volta ao Bardo, segue dispensada', async () => {
    renderNotice({ dismissedChoices: ['2014/bard/tools'] });

    await userEvent.click(screen.getByRole('button', { name: 'Dismiss: Skills' }));
    expect(notice()).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'to rogue' }));
    expect(row('Skills')).toHaveTextContent('0 of 4 picked');

    await userEvent.click(screen.getByRole('button', { name: 'to bard' }));
    expect(notice()).not.toBeInTheDocument();
  });

  it('a mesma perícia selecionada duas vezes conta uma', () => {
    renderNotice({ class: 'rogue', classChoices: { '2014/rogue/skills': ['STEALTH', 'STEALTH'] } });

    expect(row('Skills')).toHaveTextContent('1 of 4 picked');
  });

  it.each([
    ['sem edição', { edition: undefined }],
    ['em 2024', { edition: '2024' as const }],
    ['com classe escrita à mão', { class: 'Bardo das Sombras' }],
    ['com o nome da classe digitado em vez de escolhido da lista', { class: 'Barda' }],
  ])('%s: sem aviso', (_case, extra) => {
    renderNotice(extra);

    expect(notice()).not.toBeInTheDocument();
  });

  it('ficha só de leitura (o mestre lendo): sem aviso', () => {
    const character = { ...base, id: 'c1', class: 'bard', edition: '2014' } as DnD5eCharacter;
    renderWithCharacter(
      <SheetSourceContext.Provider
        value={{ readOnly: true, partyId: 'p1', apiPath: '/api/x', pagesPath: '/x' }}
      >
        <PendingChoicesNotice />
      </SheetSourceContext.Provider>,
      character,
    );

    expect(notice()).not.toBeInTheDocument();
  });
});

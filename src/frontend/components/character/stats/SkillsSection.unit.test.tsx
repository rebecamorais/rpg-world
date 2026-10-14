import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { createDnD5eCharacter } from '@shared/systems/dnd5e/factory';
import type { CharacterSkill } from '@shared/systems/dnd5e/types';

import SkillsSection from './SkillsSection';

const attributes = { ...createDnD5eCharacter('o', 'x').attributes, DEX: 14 };

function renderSkills(acrobatics?: CharacterSkill) {
  const onSkillChange = vi.fn();
  renderWithProviders(
    <SkillsSection
      attributes={attributes}
      level={5}
      skills={acrobatics ? { ACROBATICS: acrobatics } : {}}
      onSkillChange={onSkillChange}
    />,
  );
  const row = screen.getByText('Acrobatics').parentElement!;
  return { onSkillChange, row };
}

describe('SkillsSection', () => {
  it('soma o modificador do atributo da perícia (DES 14 → +2)', () => {
    const { row } = renderSkills();

    expect(row).toHaveTextContent('(DEX)+2');
  });

  it('soma a proficiência (nível 5 → +3)', () => {
    expect(renderSkills({ isProficient: true }).row).toHaveTextContent('+5');
  });

  it('a especialização dobra o bônus de proficiência', () => {
    expect(renderSkills({ isProficient: true, expertise: true }).row).toHaveTextContent('+8');
  });

  it.each([
    [undefined, 'No proficiency in Acrobatics', { isProficient: true, expertise: false }],
    [{ isProficient: true }, 'Proficient in Acrobatics', { isProficient: true, expertise: true }],
    [
      { isProficient: true, expertise: true },
      'Expertise in Acrobatics',
      { isProficient: false, expertise: false },
    ],
  ])('alterna nenhuma → proficiente → especialista → nenhuma', async (skill, name, next) => {
    const { onSkillChange } = renderSkills(skill);

    await userEvent.click(screen.getByRole('button', { name }));

    expect(onSkillChange).toHaveBeenCalledWith('ACROBATICS', next);
  });

  it('lista todas as 18 perícias em ordem alfabética', () => {
    renderSkills();

    const names = screen
      .getAllByRole('button', { name: /^No proficiency in / })
      .map((b) => b.getAttribute('aria-label')!.replace('No proficiency in ', ''));
    expect(names).toHaveLength(18);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

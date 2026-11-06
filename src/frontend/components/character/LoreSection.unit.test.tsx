import { fireEvent, screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import LoreSection from './LoreSection';

const labels = messages.characters.loreFields;
const HAIR = 'Full black curls, pinned with brass gears and a thin copper wire';

describe('LoreSection', () => {
  it('na edição, os textos longos ficam em campos que crescem e avisam a mudança', () => {
    const onChange = vi.fn();
    renderWithProviders(<LoreSection data={{ hair: HAIR }} onChange={onChange} />);

    const hair = screen.getByLabelText(labels.hair);
    expect(hair.tagName).toBe('TEXTAREA');
    expect(hair).toHaveValue(HAIR);
    expect(hair).toHaveClass('field-sizing-content');
    expect(screen.getByLabelText(labels.backstory)).toHaveClass('field-sizing-content');

    fireEvent.change(screen.getByLabelText(labels.backstory), { target: { value: 'Nova' } });
    expect(onChange).toHaveBeenCalledWith('backstory', 'Nova');
  });

  it('todos os campos têm nome na edição', () => {
    renderWithProviders(<LoreSection data={{}} onChange={vi.fn()} />);

    for (const field of [
      'age',
      'height',
      'weight',
      'eyes',
      'skin',
      'hair',
      'personalityTraits',
      'ideals',
      'bonds',
      'flaws',
      'backstory',
      'alliesAndEnemies',
      'organizations',
      'treasure',
    ] as const) {
      expect(screen.getByLabelText(labels[field])).toBeEnabled();
    }
  });

  it('na leitura mostra o texto, sem nenhum campo, e avisa o que não foi preenchido', () => {
    renderWithProviders(
      <LoreSection
        readOnly
        data={{ hair: HAIR, backstory: 'Primeira linha\nSegunda linha' }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(screen.getByText(HAIR)).toBeInTheDocument();
    expect(screen.getByText(/Primeira linha/)).toHaveClass('whitespace-pre-line');
    expect(screen.getByRole('heading', { name: labels.backstory })).toBeInTheDocument();
    // 14 fields, 2 of them filled
    expect(screen.getAllByText(labels.notFilled)).toHaveLength(12);
  });
});

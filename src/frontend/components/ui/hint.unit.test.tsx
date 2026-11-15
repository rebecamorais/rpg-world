import { fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it } from 'vitest';

import { Hint } from './hint';

// The GM's read-only sheet sits in a disabled fieldset: an explanation is reading, not editing
function renderReadOnly() {
  renderWithProviders(
    <fieldset disabled>
      <Hint label="AC" hint="How hard you are to hit.">
        <svg aria-hidden="true" />
      </Hint>
    </fieldset>,
  );
  return screen.getByRole('button', { name: 'What is AC?' });
}

describe('Hint', () => {
  it('abre ao tocar mesmo dentro de uma ficha só leitura', async () => {
    const trigger = renderReadOnly();
    expect(trigger).not.toBeDisabled();

    await userEvent.click(trigger);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip).toHaveTextContent('AC');
    expect(tooltip).toHaveTextContent('How hard you are to hit.');
  });

  it('o teclado chega nele e abre com Enter', async () => {
    const trigger = renderReadOnly();

    // tabIndex and fireEvent, not userEvent.tab() and .keyboard(): user-event counts anything in a
    // disabled fieldset as disabled, a <span> included, which browsers don't
    expect(trigger).toHaveAttribute('tabindex', '0');
    trigger.focus();
    expect(trigger).toHaveFocus();
    // Focus alone opens it; closed with Esc, Enter is what brings it back
    fireEvent.keyDown(trigger, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    fireEvent.keyDown(trigger, { key: 'Enter' });

    expect(await screen.findByRole('tooltip')).toHaveTextContent('How hard you are to hit.');
  });
});

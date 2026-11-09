import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { describe, expect, it, vi } from 'vitest';

import { CollapsedDeadRow } from './CollapsedDeadRow';
import { gmRow } from './fixtures';

const t = messages.combat;

describe('CollapsedDeadRow', () => {
  it('mostra o nome riscado e abre pelo botão', async () => {
    const onExpand = vi.fn();
    renderWithProviders(
      <ul>
        <CollapsedDeadRow row={gmRow({ name: 'Goblin', side: 'enemy' })} onExpand={onExpand} />
      </ul>,
    );
    expect(screen.getByText('Goblin').closest('s')).not.toBeNull();
    expect(screen.getByText(t.dead)).toBeInTheDocument();
    await userEvent.click(
      screen.getByRole('button', { name: `${t.detailsOf.replace('{name}', 'Goblin')}` }),
    );
    expect(onExpand).toHaveBeenCalledTimes(1);
  });
});

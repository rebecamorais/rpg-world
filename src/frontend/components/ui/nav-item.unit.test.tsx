import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { NavItem, SidebarExpandedContext } from './nav-item';

const NAME = 'Revisão F2 A Chilli e a mesa de nome comprido';

describe('NavItem', () => {
  it('o rótulo cortado guarda o nome inteiro no title', () => {
    render(<NavItem href="/parties/p1" label={NAME} isSubItem />);

    const link = screen.getByRole('link', { name: NAME });
    expect(link.querySelector('span')).toHaveAttribute('title', NAME);
  });

  it('recolhido, o rótulo continua dando nome ao link', () => {
    render(
      <SidebarExpandedContext.Provider value={false}>
        <NavItem href="/parties/p1" label={NAME} />
      </SidebarExpandedContext.Provider>,
    );

    expect(screen.getByRole('link', { name: NAME })).toBeInTheDocument();
  });
});

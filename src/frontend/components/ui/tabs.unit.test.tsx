import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { Tabs, TabsList, TabsTrigger } from './tabs';

describe('TabsList', () => {
  afterEach(() => vi.restoreAllMocks());

  it('o indicador acompanha a aba ativa', async () => {
    // jsdom has no layout: each tab reports its position from its text
    vi.spyOn(HTMLElement.prototype, 'offsetLeft', 'get').mockImplementation(function (
      this: HTMLElement,
    ) {
      return this.textContent === 'Combate' ? 100 : 4;
    });
    vi.spyOn(HTMLElement.prototype, 'offsetWidth', 'get').mockReturnValue(80);

    renderWithProviders(
      <Tabs defaultValue="rp">
        <TabsList>
          <TabsTrigger value="rp">Role Play</TabsTrigger>
          <TabsTrigger value="combat">Combate</TabsTrigger>
        </TabsList>
      </Tabs>,
    );
    const list = screen.getByRole('tablist');
    expect(list.style.getPropertyValue('--tab-left')).toBe('4px');
    expect(list).toHaveAttribute('data-indicator');

    await userEvent.click(screen.getByRole('tab', { name: 'Combate' }));
    expect(list.style.getPropertyValue('--tab-left')).toBe('100px');
    expect(list.style.getPropertyValue('--tab-width')).toBe('80px');
  });
});

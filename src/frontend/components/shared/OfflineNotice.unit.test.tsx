import { act, screen } from '@testing-library/react';
import { messages, renderWithProviders } from '@tests/helpers/render';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { OfflineNotice } from './OfflineNotice';

describe('OfflineNotice', () => {
  afterEach(() => vi.restoreAllMocks());

  it('aparece ao perder a conexão e some quando ela volta', () => {
    renderWithProviders(<OfflineNotice />);
    const status = screen.getByRole('status');
    expect(status).toBeEmptyDOMElement();

    act(() => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);
      window.dispatchEvent(new Event('offline'));
    });
    expect(status).toHaveTextContent(messages.common.offline);

    act(() => {
      vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true);
      window.dispatchEvent(new Event('online'));
    });
    expect(status).toBeEmptyDOMElement();
  });
});

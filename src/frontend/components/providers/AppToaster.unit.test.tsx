import { act, screen } from '@testing-library/react';
import { renderWithProviders } from '@tests/helpers/render';
import { toast } from 'sonner';
import { describe, expect, it, vi } from 'vitest';

import pt from '../../../../messages/pt.json';
import { AppToaster } from './AppToaster';

vi.mock('next-intl/server', () => ({
  getTranslations: async (namespace: 'common') => (key: keyof typeof pt.common) =>
    pt[namespace][key],
}));

// Sonner captures the pointer to follow a swipe; jsdom has no pointer capture
Element.prototype.setPointerCapture ??= () => {};

describe('AppToaster', () => {
  it('a região dos avisos tem o nome no idioma da página, não o "Notifications" do Sonner', async () => {
    renderWithProviders(await AppToaster());
    act(() => {
      toast('Salvo');
    });

    expect(
      await screen.findByRole('region', { name: new RegExp(`^${pt.common.notifications}`) }),
    ).toBeInTheDocument();
  });
});

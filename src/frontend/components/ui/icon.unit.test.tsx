import { render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import gameIconSprite from '@frontend/constants/game-icons.svg';

import { AppIcon } from './icon';

describe('AppIcon', () => {
  it('desenha game icons a partir do sprite estático, sem JS do ícone nem rede', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    const { container } = render(<AppIcon variant="game" name="crystal-ball" size={24} />);

    const svg = container.querySelector('svg');
    expect(svg).toHaveAttribute('width', '24');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg!.querySelector('use')).toHaveAttribute('href', `${gameIconSprite.src}#crystal-ball`);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('não desenha nada para um game icon que não foi empacotado', () => {
    const { container } = render(<AppIcon variant="game" name="not-a-bundled-icon" />);

    expect(container).toBeEmptyDOMElement();
  });

  it('desenha ícones de sistema do Lucide', () => {
    const { container } = render(<AppIcon name="Trash2" />);

    expect(container.querySelector('svg.lucide')).not.toBeNull();
  });
});

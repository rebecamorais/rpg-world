import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AnalyticsScripts } from './AnalyticsScripts';

let pathname = '/';
vi.mock('next/navigation', () => ({ usePathname: () => pathname }));
vi.mock('next/script', () => ({
  default: (props: { src: string }) => <div data-testid="script" data-src={props.src} />,
}));
vi.mock('@vercel/analytics/next', () => ({ Analytics: () => <div data-testid="vercel" /> }));

const loaded = (container: HTMLElement) => container.querySelectorAll('[data-testid]').length;

describe('AnalyticsScripts', () => {
  beforeEach(() => {
    pathname = '/';
  });

  it('carrega os dois scripts nas páginas comuns', () => {
    const { container } = render(<AnalyticsScripts enabled />);

    expect(loaded(container)).toBe(2);
  });

  it.each(['/delete-account', '/en/delete-account', '/delete-account/'])(
    'não carrega nenhum em %s, onde a URL leva o token',
    (path) => {
      pathname = path;
      const { container } = render(<AnalyticsScripts enabled />);

      expect(loaded(container)).toBe(0);
    },
  );

  it('uma página com nome parecido continua com analytics', () => {
    pathname = '/settings/profile';
    const { container } = render(<AnalyticsScripts enabled />);

    expect(loaded(container)).toBe(2);
  });

  it('fora da produção não carrega nada', () => {
    const { container } = render(<AnalyticsScripts enabled={false} />);

    expect(loaded(container)).toBe(0);
  });
});

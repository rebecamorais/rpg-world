import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { THEMES, type Theme } from '../../src/frontend/lib/theme';

/**
 * Serious and critical WCAG A/AA violations on the page (or only inside `include`), checked once
 * per theme. The theme the page had is restored afterwards.
 */
export async function violations(
  page: Page,
  opts: { include?: string; disabledRules?: string[] } = {},
): Promise<{ theme: Theme; id: string; impact: string; nodes: string[] }[]> {
  const before = await page.evaluate(() => document.documentElement.dataset.theme);
  const found: { theme: Theme; id: string; impact: string; nodes: string[] }[] = [];
  // Switching tokens re-runs every transition-colors; axe must read the final colors, not a blend
  const still = await page.addStyleTag({
    content: '*, *::before, *::after { transition: none !important; animation: none !important; }',
  });
  try {
    for (const theme of THEMES) {
      await page.evaluate(async (t) => {
        document.documentElement.dataset.theme = t;
        // Two frames: styles recalculated and painted before axe reads the colors
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        await Promise.all(document.getAnimations().map((a) => a.finished.catch(() => {})));
      }, theme);
      let builder = new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(opts.disabledRules ?? []);
      if (opts.include) builder = builder.include(opts.include);
      const results = await builder.analyze();
      for (const v of results.violations) {
        if (v.impact !== 'serious' && v.impact !== 'critical') continue;
        found.push({
          theme,
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => `${n.target.join(' ')} → ${n.html.slice(0, 160)}`),
        });
      }
    }
  } finally {
    await page.evaluate((t) => {
      if (t === undefined) delete document.documentElement.dataset.theme;
      else document.documentElement.dataset.theme = t;
      // Flush styles now, while transitions are still off
      void getComputedStyle(document.body).color;
    }, before);
    // Removed only after the restore, so going back to the old theme doesn't animate either
    await still.evaluate((el) => (el as Element).remove());
  }
  return found;
}

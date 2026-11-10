import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

// e2e does not resolve the app's path aliases; keep in sync with THEMES in src/frontend/lib/theme.ts
const THEMES = ['dark', 'light'] as const;
type Theme = (typeof THEMES)[number];

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
  try {
    for (const theme of THEMES) {
      await page.evaluate(
        (t) =>
          new Promise<void>((resolve) => {
            document.documentElement.dataset.theme = t;
            // Two frames: styles recalculated and painted before axe reads the colors
            requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
          }),
        theme,
      );
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
    }, before);
  }
  return found;
}

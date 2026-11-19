import { BASE_URL } from './support/env';
import { expect, hydrated, test } from './support/fixtures';

// Phase 2 review: signed in, the header's right side ("Meus personagens", "Sair" with its icon,
// theme, contact, language) grew. Outside the dashboard, between 640 and ~730px in Portuguese, it
// could run past the screen or over the logo

for (const width of [640, 700]) {
  test(`logada, em ${width}px, o header cabe: sem rolagem lateral e sem cobrir o logo`, async ({
    page,
    context,
    user: _,
  }) => {
    // Portuguese: the longest labels ("Meus personagens", "Português")
    await context.addCookies([{ name: 'NEXT_LOCALE', value: 'pt', url: BASE_URL }]);
    await page.setViewportSize({ width, height: 800 });

    for (const path of ['/', '/features', '/change-password']) {
      await page.goto(path);
      const header = page.getByRole('banner');
      await hydrated(header.getByRole('link', { name: 'Meus personagens' }));

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
      );
      expect(overflow, `${path}: horizontal scroll`).toBeLessThanOrEqual(0);

      const logo = (await header.getByRole('link', { name: 'RPG World' }).boundingBox())!;
      const controls = await header
        .locator('a, button, [role="combobox"]')
        .evaluateAll((elements) =>
          elements
            // The logo: the home, at its address in Portuguese
            .filter((element) => !['/', '/pt'].includes(element.getAttribute('href') ?? ''))
            .map((element) => {
              const box = element.getBoundingClientRect();
              return { name: element.textContent?.trim(), left: box.left, right: box.right };
            })
            .filter((box) => box.right > box.left),
        );

      expect(controls.length, `${path}: the header's actions`).toBeGreaterThan(0);
      for (const control of controls) {
        expect(control.left, `${path}: "${control.name}" over the logo`).toBeGreaterThanOrEqual(
          logo.x + logo.width,
        );
        expect(control.right, `${path}: "${control.name}" past the screen`).toBeLessThanOrEqual(
          width,
        );
      }
    }
  });
}

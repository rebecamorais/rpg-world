/**
 * Pre-renders the Grimoire material noise textures (SVG feTurbulence, inline in
 * materials.module.css) into WebP files, so the lab can compare both sources.
 *   npx tsx scripts/grimoire-bake-textures.ts
 *
 * Each texture is drawn by Chromium from the very same SVG, at 2x its tile size (sharp on
 * DPR 2 screens), and saved to public/grimoire/materials/<name>.webp.
 */
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';

const CSS = 'src/frontend/components/grimoire/material-surface/materials.module.css';
const OUT = 'public/grimoire/materials';
const SCALE = 2;
const QUALITY = 0.85;

const css = readFileSync(CSS, 'utf8');
const textures = [...css.matchAll(/--([a-z-]+):\s*url\("(data:image\/svg\+xml,[^"]+)"\)/g)].map(
  ([, name, url]) => ({ name, url }),
);

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { name, url } of textures) {
  const base64 = await page.evaluate(
    async ({ url, scale, quality }) => {
      const img = new Image();
      img.src = url;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', quality).split(',')[1];
    },
    { url, scale: SCALE, quality: QUALITY },
  );
  const file = `${OUT}/${name}.webp`;
  writeFileSync(file, Buffer.from(base64, 'base64'));
  console.log(`${file}  ${Buffer.byteLength(base64, 'base64')} bytes`);
}
await browser.close();

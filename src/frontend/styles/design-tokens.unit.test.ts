import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Components use the semantic tokens from app/globals.css (bg-card, text-muted-foreground,
 * text-danger-flare...), never the raw Tailwind palette or hard-coded colors, so a color
 * decision lives in one place.
 */
const ROOTS = ['app', 'src/frontend'];

const PALETTE =
  'zinc|slate|gray|grey|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose|white|black';
const UTILITY =
  'bg|text|border|border-[trblxy]|ring|ring-offset|outline|from|via|to|fill|stroke|shadow|divide|placeholder|decoration|caret|accent';
const RAW_PALETTE = new RegExp(
  `\\b(?:${UTILITY})-(?:${PALETTE})(?:-\\d{2,3})?(?:/[\\d.]+)?\\b`,
  'g',
);
// Arbitrary colors in a class, e.g. bg-[#08080a] or shadow-[0_0_8px_rgba(0,0,0,0.5)]
const ARBITRARY_COLOR = /\b[a-z-]+-\[[^\]]*(?:#[0-9a-fA-F]{3,8}|rgba?\()[^\]]*\]/g;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.tsx?$/.test(entry.name) && !entry.name.includes('.test.') ? [full] : [];
  });
}

function violations(pattern: RegExp) {
  return ROOTS.flatMap(sourceFiles).flatMap((file) => {
    const matches = readFileSync(file, 'utf8').match(pattern) ?? [];
    return matches.map((match) => `${file}: ${match}`);
  });
}

describe('design tokens', () => {
  it('nenhum componente usa a paleta crua do Tailwind', () => {
    expect(violations(RAW_PALETTE)).toEqual([]);
  });

  it('nenhum componente usa cor fixa em classe arbitrária', () => {
    expect(violations(ARBITRARY_COLOR)).toEqual([]);
  });
});

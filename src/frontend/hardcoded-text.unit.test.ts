import { readFileSync, readdirSync, statSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(import.meta.dirname, '../..');
const DIRS = ['src/frontend/components', 'app'];
// shadcn primitives take their text from the caller
const IGNORED_DIRS = ['src/frontend/components/ui'];

// Text that is the same in every language
const ALLOWED = new Set(['Rebs Tech Studio', 'Sponsor rebecamorais']);

// JSX text between tags; the lookbehind skips `=>` and generics such as `Promise<void>`
const JSX_TEXT = /(?<![=-])>\s*([^<>{}\n]*\p{L}{2,}[^<>{}\n]*?)\s*</gu;
const TEXT_ATTRIBUTE = /\b(?:placeholder|title|aria-label|alt)="([^"]*\p{L}{2,}[^"]*)"/gu;

function componentFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) {
      return IGNORED_DIRS.some((ignored) => full.endsWith(ignored)) ? [] : componentFiles(full);
    }
    return full.endsWith('.tsx') && !full.includes('.test.') ? [full] : [];
  });
}

describe('textos da interface', () => {
  it('passam pelo next-intl em vez de ficarem fixos no código', () => {
    const hardcoded = DIRS.flatMap((dir) => componentFiles(path.join(ROOT, dir))).flatMap(
      (file) => {
        const source = readFileSync(file, 'utf-8');
        return (
          [...source.matchAll(JSX_TEXT), ...source.matchAll(TEXT_ATTRIBUTE)]
            .map((match) => match[1].trim())
            // Text starts with a letter or digit; anything else is code between tags (`) : x ? (`)
            .filter((text) => /^[\p{L}\d]/u.test(text) && !ALLOWED.has(text))
            .map((text) => `${path.relative(ROOT, file)}: "${text}"`)
        );
      },
    );

    expect(hardcoded).toEqual([]);
  });
});

import type { IconifyJSON } from '@iconify/types';
import { getIconData } from '@iconify/utils';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/** The sprite, imported by AppIcon: Next serves it under /_next/static with a hashed, immutable URL. */
export const GAME_ICON_SPRITE_FILE = 'src/frontend/constants/game-icons.svg';
/** The names in the sprite, so AppIcon draws nothing for one that isn't there. */
export const GAME_ICON_NAMES_FILE = 'src/frontend/constants/game-icon-names.generated.ts';

const require = createRequire(import.meta.url);

const SOURCE_DIRS = ['src', 'app'];
const SOURCE_FILE = /\.(ts|tsx)$/;
// Tests, and generated files (the sprite's own list of names would keep every icon forever)
const SKIPPED_FILE = /\.(test|generated)\.(ts|tsx)$/;
const STRING_LITERAL = /['"`]([a-z0-9]+(?:-[a-z0-9]+)*)['"`]/g;

export interface GameIconData {
  body: string;
  width: number;
  height: number;
}

function loadCollection(): IconifyJSON {
  return JSON.parse(
    readFileSync(require.resolve('@iconify-json/game-icons/icons.json'), 'utf-8'),
  ) as IconifyJSON;
}

function sourceFiles(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) return sourceFiles(full);
    return SOURCE_FILE.test(entry) && !SKIPPED_FILE.test(entry) ? [full] : [];
  });
}

/**
 * Game icon names used by the app: every string literal in the sources that is an icon of the
 * game-icons collection. Literals that only look like icon names just add a few bytes.
 */
export function buildGameIcons(root = process.cwd()): Record<string, GameIconData> {
  const collection = loadCollection();
  const names = new Set<string>();

  for (const file of SOURCE_DIRS.flatMap((dir) => sourceFiles(path.join(root, dir)))) {
    for (const [, literal] of readFileSync(file, 'utf-8').matchAll(STRING_LITERAL)) {
      if (collection.icons[literal] || collection.aliases?.[literal]) names.add(literal);
    }
  }

  return Object.fromEntries(
    [...names].sort().map((name) => {
      const icon = getIconData(collection, name)!;
      return [
        name,
        {
          body: icon.body,
          width: icon.width ?? collection.width ?? 16,
          height: icon.height ?? collection.height ?? 16,
        },
      ];
    }),
  );
}

/** One `<symbol>` per icon, referenced as `<use href="<sprite url>#<name>">`. */
export function buildGameIconSprite(icons: Record<string, GameIconData>): string {
  const symbols = Object.entries(icons).map(
    ([name, { body, width, height }]) =>
      `<symbol id="${name}" viewBox="0 0 ${width} ${height}">${body}</symbol>`,
  );
  // The root's size only satisfies the bundler's image import; each <symbol> has its own viewBox
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">${symbols.join('')}</svg>\n`;
}

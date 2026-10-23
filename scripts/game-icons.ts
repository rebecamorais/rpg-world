import type { IconifyJSON } from '@iconify/types';
import { getIconData } from '@iconify/utils';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

/** Folder of the sprite, served as is: `/icons/game-<hash>.svg`. */
export const GAME_ICON_SPRITE_DIR = 'public/icons';
/** Where the app reads the sprite's current URL from. */
export const GAME_ICON_SPRITE_URL_FILE = 'src/frontend/constants/game-icon-sprite.generated.ts';

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

/** One `<symbol>` per icon, referenced as `<use href="/icons/game-<hash>.svg#<name>">`. */
export function buildGameIconSprite(icons: Record<string, GameIconData>): string {
  const symbols = Object.entries(icons).map(
    ([name, { body, width, height }]) =>
      `<symbol id="${name}" viewBox="0 0 ${width} ${height}">${body}</symbol>`,
  );
  return `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`;
}

/** The sprite's file name changes with its content, so browsers can cache it for good. */
export function gameIconSpriteName(sprite: string): string {
  return `game-${createHash('sha256').update(sprite).digest('hex').slice(0, 10)}.svg`;
}

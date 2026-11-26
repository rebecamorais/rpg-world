import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * Ratchet on D&D imports outside the system module. Code that is not part of the dnd5e system
 * must reach it through the registry (`shared/systems/registry.ts`). The allowlist holds the
 * files that still import it directly; it can only shrink.
 */
const ROOTS = ['app', 'src', 'shared'];
const SYSTEM_DIR = 'shared/systems/dnd5e';
const ALLOWLIST_FILE = 'system-boundary.allowlist.json';
const SOURCE = /\.(ts|tsx|js|jsx|mjs)$/;
const TEST_FILE = /\.(test|spec)\./;

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : walk(full);
    return SOURCE.test(entry.name) && !TEST_FILE.test(entry.name) ? [full] : [];
  });

const SPECIFIER = /(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+|\brequire\s*\(\s*)(['"])([^'"\n]+)\1/g;

const resolvesIntoSystem = (file: string, specifier: string): boolean => {
  let target: string;
  if (specifier.startsWith('@shared/')) {
    target = path.posix.join('shared', specifier.slice('@shared/'.length));
  } else if (specifier.startsWith('.')) {
    target = path.posix.join(path.posix.dirname(file), specifier);
  } else {
    return false;
  }
  return target === SYSTEM_DIR || target.startsWith(`${SYSTEM_DIR}/`);
};

const importsSystem = (file: string): boolean =>
  [...readFileSync(file, 'utf8').matchAll(SPECIFIER)].some((match) =>
    resolvesIntoSystem(file, match[2]),
  );

// Inside the system module: a `dnd5e` directory segment or a file name starting with `dnd5e`.
const isExempt = (file: string): boolean => {
  const segments = file.split('/');
  return (
    segments.slice(0, -1).includes('dnd5e') || segments[segments.length - 1].startsWith('dnd5e')
  );
};

const allowlist: string[] = JSON.parse(readFileSync(ALLOWLIST_FILE, 'utf8'));
const allowed = new Set(allowlist);
const files = ROOTS.flatMap(walk);
const offenders = files.filter((file) => !isExempt(file) && importsSystem(file));

describe('D&D import boundary', () => {
  it('keeps the allowlist sorted', () => {
    expect(allowlist).toEqual([...allowlist].sort());
  });

  it('allows no new D&D import outside the system module', () => {
    const fresh = offenders.filter((file) => !allowed.has(file));
    expect(
      fresh.map(
        (file) =>
          `Novo import do D&D fora do módulo do sistema: ${file}. Use o registro (\`shared/systems/registry.ts\`) ou ponha o código em \`.../dnd5e/\`.`,
      ),
    ).toEqual([]);
  });

  it('drops allowlisted files that are gone or no longer import D&D', () => {
    const stale = allowlist.filter(
      (file) => !existsSync(file) || isExempt(file) || !importsSystem(file),
    );
    expect(stale.map((file) => `Tire ${file} de ${ALLOWLIST_FILE}`)).toEqual([]);
  });
});

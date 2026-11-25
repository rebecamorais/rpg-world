import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

/*
 * docs/INDEX.md is what agents read first, so a stale index sends them to the wrong place.
 * Every relative link must resolve, and every plan and spec must be listed.
 */
const INDEX = 'docs/INDEX.md';
const text = readFileSync(INDEX, 'utf8');

const relativeLinks = [...text.matchAll(/\]\(([^)\s]+)\)/g)]
  .map((match) => match[1].split('#')[0])
  .filter((target) => target && !/^[a-z]+:/i.test(target));

const linked = new Set(relativeLinks.map((target) => path.join(path.dirname(INDEX), target)));

const listed = (dir: string) =>
  readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(dir, name));

describe('docs/INDEX.md', () => {
  it.each([...linked])('links to %s, which exists', (target) => {
    expect(existsSync(target)).toBe(true);
  });

  it.each([...listed('docs/plans'), ...listed('docs/superpowers/specs')])('lists %s', (doc) => {
    expect(linked.has(doc)).toBe(true);
  });
});

#!/usr/bin/env node
/**
 * measure-volume.mjs: measures the translatable volume of the RPGWorld repository.
 * Plain Node (>= 20), no dependencies. Read-only: it only reads files and runs `git log` / `git show`.
 *
 * Usage (from the repository root):
 *   node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs            # everything
 *   node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs --no-git   # skips the git history parts (fast)
 *   node docs/discovery/localization-infrastructure/scripts/measure-volume.mjs --json out.json
 *
 * Output is Markdown (tables), printed to stdout. Everything labelled ESTIMATE is a heuristic or
 * arithmetic projection; everything else is a measurement.
 *
 * Definitions (never conflate them):
 *   file     = a file on disk
 *   key      = a leaf of a JSON file (string value), identified by its path; a "segment" is the
 *              equivalent for Markdown/plain text (a blank-line separated block outside code fences)
 *   string   = the text value of a key / segment ("strings" and "keys" are 1:1 inside one language)
 *   unique   = distinct after EXACT dedup (same characters) inside the scope being reported
 *   words    = whitespace-separated tokens   chars = Unicode code points   tokens = ESTIMATE only
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const args = process.argv.slice(2);
const NO_GIT = args.includes('--no-git');
const JSON_OUT = args.includes('--json') ? args[args.indexOf('--json') + 1] : null;

// ---------- ESTIMATE heuristics (assumptions, not measurements) ----------
const CHARS_PER_TOKEN = { en: 4.0, pt: 3.5, es: 3.5, sv: 3.2 }; // rule-of-thumb for BPE tokenizers
const SV_CHAR_RATIO_ASSUMED = 1.0; // there is (almost) no sv text to measure; assumption

const LANGS = ['pt', 'es', 'sv'];
const TYPES = ['spells', 'items', 'conditions', 'classes'];
const BOOKS = ['5.1', '5.2'];

// ---------- helpers ----------
const rd = (p) => readFileSync(path.join(ROOT, p), 'utf8');
const readJson = (p) => {
  try {
    return JSON.parse(rd(p));
  } catch {
    return null;
  }
};
const cp = (s) => [...s].length;
const words = (s) => (s.trim() === '' ? 0 : s.trim().split(/\s+/).length);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const fmt = (n) =>
  Number.isInteger(n)
    ? n.toLocaleString('en-US')
    : n.toLocaleString('en-US', { maximumFractionDigits: 1 });
const pct = (a, b) => (b === 0 ? 'n/a' : `${((100 * a) / b).toFixed(1)}%`);
function quantile(sorted, q) {
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.ceil(q * sorted.length) - 1);
  return sorted[Math.max(0, i)];
}
function table(headers, rows) {
  const out = [`| ${headers.join(' | ')} |`, `|${headers.map(() => '---').join('|')}|`];
  for (const r of rows)
    out.push(`| ${r.map((c) => (typeof c === 'number' ? fmt(c) : c)).join(' | ')} |`);
  return out.join('\n');
}
const log = [];
const print = (s = '') => {
  log.push(s);
  console.log(s);
};
const results = {};

/** Flattens a JSON value into Map(path -> string); arrays use [i]; non-string leaves are ignored. */
function flatten(value, prefix = '', out = new Map()) {
  if (typeof value === 'string') out.set(prefix, value);
  else if (Array.isArray(value)) value.forEach((v, i) => flatten(v, `${prefix}[${i}]`, out));
  else if (value && typeof value === 'object')
    for (const [k, v] of Object.entries(value)) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

/** Stats over a list of strings (empty strings are excluded by the caller). */
function stats(strs) {
  const uniq = [...new Set(strs)];
  const lens = strs.map(cp).sort((a, b) => a - b);
  const wl = strs.map(words).sort((a, b) => a - b);
  return {
    strings: strs.length,
    unique: uniq.length,
    chars: sum(lens),
    words: sum(wl),
    uniqueChars: sum(uniq.map(cp)),
    uniqueWords: sum(uniq.map(words)),
    meanChars: strs.length ? sum(lens) / strs.length : 0,
    medianChars: quantile(lens, 0.5),
    p95Chars: quantile(lens, 0.95),
    maxChars: lens.at(-1) ?? 0,
    medianWords: quantile(wl, 0.5),
    maxWords: wl.at(-1) ?? 0,
    estTokensIn: Math.round(sum(lens) / CHARS_PER_TOKEN.en),
    estTokensInUnique: Math.round(sum(uniq.map(cp)) / CHARS_PER_TOKEN.en),
  };
}

// ---------- 1. collect corpora ----------
/** corpus: { id, label, files, entries: Map(key -> string) for the source language (en) } */
const corpora = [];
const targetsOf = {}; // corpus id -> { lang -> Map(key -> string) | null }

// 1a. UI
{
  const en = flatten(readJson('messages/en.json') ?? {});
  corpora.push({
    id: 'ui',
    group: 'Application UI',
    label: 'messages/*.json',
    files: ['messages/en.json'],
    entries: en,
  });
  targetsOf.ui = Object.fromEntries(
    LANGS.map((l) => [
      l,
      readJson(`messages/${l}.json`) ? flatten(readJson(`messages/${l}.json`)) : new Map(),
    ]),
  );
}
// 1b. SRD content (en source = content/dnd5e/srd-X/i18n/en/<type>.json)
for (const book of BOOKS) {
  for (const type of TYPES) {
    const rel = (l) => `content/dnd5e/srd-${book}/i18n/${l}/${type}.json`;
    const id = `srd${book.replace('.', '')}:${type}`;
    corpora.push({
      id,
      group: `SRD ${book}`,
      label: `srd-${book} ${type}`,
      files: [rel('en')],
      entries: flatten(readJson(rel('en')) ?? {}),
    });
    targetsOf[id] = Object.fromEntries(LANGS.map((l) => [l, flatten(readJson(rel(l)) ?? {})]));
  }
}
// 1c. Markdown / text corpora
function walk(dir, filter, out = []) {
  if (!existsSync(path.join(ROOT, dir))) return out;
  for (const name of readdirSync(path.join(ROOT, dir))) {
    if (name === 'node_modules' || name === '.git' || name === '.next') continue;
    const rel = path.posix.join(dir, name);
    const st = statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel, filter, out);
    else if (filter(rel)) out.push(rel);
  }
  return out;
}
/** Segments of a Markdown/text file: blank-line separated blocks, outside fenced code. */
function mdSegments(text) {
  let codeChars = 0;
  const noCode = text.replace(/^(```|~~~)[^\n]*\n[\s\S]*?^\1[^\n]*$/gm, (m) => {
    codeChars += cp(m);
    return '';
  });
  const noFront = noCode.replace(/^---\n[\s\S]*?\n---\n/, '');
  const segs = noFront
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter((s) => s !== '');
  return { segs, codeChars };
}
function mdCorpus(id, group, label, files) {
  const entries = new Map();
  let codeChars = 0;
  for (const f of files) {
    const { segs, codeChars: c } = mdSegments(rd(f));
    codeChars += c;
    segs.forEach((s, i) => entries.set(`${f}#${i}`, s));
  }
  corpora.push({ id, group, label, files, entries, codeChars });
}
// docs/ (excluding docs/discovery, which is this research itself), by sub-folder
const docsAll = walk('docs', (f) => f.endsWith('.md') && !f.startsWith('docs/discovery/'));
const bucket = (f) => {
  const p = f.split('/');
  if (p[1] === 'plans') return 'docs/plans';
  if (p[1] === 'superpowers') return 'docs/superpowers';
  if (p[1] === 'revisao-telas') return 'docs/revisao-telas';
  if (p[1] === 'grimoire-enchantments') return 'docs/grimoire-enchantments';
  return 'docs/(other)';
};
for (const b of [
  'docs/plans',
  'docs/superpowers',
  'docs/revisao-telas',
  'docs/grimoire-enchantments',
  'docs/(other)',
]) {
  mdCorpus(
    `docs:${b}`,
    'Docs under docs/',
    b,
    docsAll.filter((f) => bucket(f) === b),
  );
}
const rootMd = readdirSync(ROOT).filter(
  (f) => f.endsWith('.md') && statSync(path.join(ROOT, f)).isFile(),
);
mdCorpus('root-md', 'Root *.md', 'root *.md', rootMd);
mdCorpus(
  'agents-md',
  'Other repo Markdown',
  '.agents/ + .github/ *.md',
  walk('.agents', (f) => f.endsWith('.md')).concat(walk('.github', (f) => f.endsWith('.md'))),
);
// public / marketing plain files and legal text
mdCorpus('public-txt', 'Public files', 'public/llms.txt', ['public/llms.txt']);
mdCorpus('ogl', 'Legal text', 'content/dnd5e/OGL-1.0a.txt (third-party licence text, not ours)', [
  'content/dnd5e/OGL-1.0a.txt',
]);

// ---------- 2. per-category volume ----------
const nonEmpty = (m) => [...m.values()].filter((s) => s !== '');

print('# measure-volume.mjs output');
print('');
print(
  `Generated: ${new Date().toISOString()} (repo HEAD ${safeGit(['rev-parse', '--short', 'HEAD'])})`,
);
print('');
print('## A. Source-language (English) volume per category');
print('');
print(
  'Columns: files / strings (=keys or segments) / unique strings (exact dedup within the category) / words / chars / est. tokens (ESTIMATE, chars/4).',
);
print('');
const rowsA = [];
for (const c of corpora) {
  const st = stats(nonEmpty(c.entries));
  c.stats = st;
  rowsA.push([
    c.group,
    c.label,
    c.files.length,
    st.strings,
    st.unique,
    st.words,
    st.chars,
    st.estTokensIn,
    st.uniqueWords,
    st.uniqueChars,
  ]);
}
print(
  table(
    [
      'Group',
      'Category',
      'Files',
      'Strings',
      'Unique',
      'Words',
      'Chars',
      'Est. tokens (chars/4)',
      'Words (unique)',
      'Chars (unique)',
    ],
    rowsA,
  ),
);
results.sourceVolume = rowsA;
print('');
print(
  'NOTE: docs/, root *.md, .agents/ and .github/ Markdown are mostly written in Portuguese (see docs/INDEX.md), so chars/4 understates their tokens (Portuguese ~3.5 chars/token). The UI, SRD and llms.txt rows are English sources.',
);
print('');
print('Length distribution per category (characters per string; words in the last two columns):');
print('');
print(
  table(
    ['Category', 'Mean', 'Median', 'p95', 'Max', 'Median words', 'Max words'],
    corpora.map((c) => [
      c.label,
      Math.round(c.stats.meanChars),
      c.stats.medianChars,
      c.stats.p95Chars,
      c.stats.maxChars,
      c.stats.medianWords,
      c.stats.maxWords,
    ]),
  ),
);
print('');
const mdCodeNote = corpora
  .filter((c) => c.codeChars !== undefined)
  .map((c) => `${c.label}: ${fmt(c.codeChars)}`);
print(
  `Characters inside fenced code blocks, EXCLUDED from the Markdown counts above: ${mdCodeNote.join('; ')}.`,
);
print('');

// Group subtotals
function groupTotals(ids, label) {
  const cs = corpora.filter((c) => ids(c));
  const all = cs.flatMap((c) => nonEmpty(c.entries));
  const st = stats(all);
  return [
    label,
    cs.reduce((n, c) => n + c.files.length, 0),
    st.strings,
    st.unique,
    st.words,
    st.chars,
    st.estTokensIn,
    st.uniqueWords,
    st.uniqueChars,
  ];
}
print(
  'Group subtotals (unique = exact dedup ACROSS the whole group, so it can be lower than the sum of the rows above):',
);
print('');
const groupRows = [
  groupTotals((c) => c.id === 'ui', 'Application UI'),
  groupTotals((c) => c.group === 'SRD 5.1', 'SRD 5.1 (4 types)'),
  groupTotals((c) => c.group === 'SRD 5.2', 'SRD 5.2 (4 types)'),
  groupTotals(
    (c) => c.id === 'ui' || c.group.startsWith('SRD'),
    'PRODUCT CORPUS = UI + SRD 5.1 + SRD 5.2',
  ),
  groupTotals((c) => c.group === 'Docs under docs/', 'docs/ (md, excl. docs/discovery)'),
  groupTotals((c) => ['root-md', 'agents-md'].includes(c.id), 'root *.md + .agents/.github *.md'),
  groupTotals((c) => ['public-txt'].includes(c.id), 'public/llms.txt'),
];
print(
  table(
    [
      'Group',
      'Files',
      'Strings',
      'Unique',
      'Words',
      'Chars',
      'Est. tokens (chars/4)',
      'Words (unique)',
      'Chars (unique)',
    ],
    groupRows,
  ),
);
results.groupRows = groupRows;
print('');

// SRD per type, both books together
print('SRD by type, both books together (strings, words):');
print('');
print(
  table(
    ['Type', 'Strings 5.1', 'Strings 5.2', 'Words 5.1', 'Words 5.2'],
    TYPES.map((t) => {
      const a = corpora.find((c) => c.id === `srd51:${t}`).stats;
      const b = corpora.find((c) => c.id === `srd52:${t}`).stats;
      return [t, a.strings, b.strings, a.words, b.words];
    }),
  ),
);
print('');

// UI breakdown by top-level namespace
{
  const ui = corpora.find((c) => c.id === 'ui');
  const byNs = new Map();
  for (const [k, v] of ui.entries) {
    if (v === '') continue;
    const ns = k.split(/[.[]/)[0];
    if (!byNs.has(ns)) byNs.set(ns, []);
    byNs.get(ns).push(v);
  }
  const rows = [...byNs.entries()]
    .map(([ns, strs]) => ({ ns, st: stats(strs) }))
    .sort((a, b) => b.st.words - a.st.words);
  print('UI by top-level namespace (top 15 by words; total namespaces: ' + rows.length + '):');
  print('');
  print(
    table(
      ['Namespace', 'Strings', 'Words', 'Chars'],
      rows.slice(0, 15).map((r) => [r.ns, r.st.strings, r.st.words, r.st.chars]),
    ),
  );
  print('');
  const PUBLIC_NS = [
    'landing',
    'features',
    'seo',
    'terms',
    'privacy',
    'footer',
    'translationInvite',
    'demo',
    'login',
    'register',
    'forgotPassword',
    'resetPassword',
    'maintenance',
    'notFound',
    'errorPage',
  ];
  const pub = rows.filter((r) => PUBLIC_NS.includes(r.ns));
  const pubAll = [...byNs.entries()].filter(([ns]) => PUBLIC_NS.includes(ns)).flatMap(([, s]) => s);
  const stp = stats(pubAll);
  print(
    `Public/marketing/legal namespaces INSIDE the UI file (a subset of the UI row, NOT additional): ${PUBLIC_NS.join(', ')}.`,
  );
  print(
    `Subset total: ${fmt(stp.strings)} strings, ${fmt(stp.words)} words, ${fmt(stp.chars)} chars. Of which terms+privacy (legal): ${fmt(stats([...byNs.entries()].filter(([ns]) => ['terms', 'privacy'].includes(ns)).flatMap(([, s]) => s)).words)} words.`,
  );
  print('');
  results.uiNamespaces = rows.map((r) => [r.ns, r.st.strings, r.st.words, r.st.chars]);
  void pub;
}

// ---------- 3. content-type structure (which fields are translatable) ----------
{
  print('## B. Translatable fields (SRD en files)');
  print('');
  const cnt = new Map();
  for (const c of corpora.filter((c) => c.id.startsWith('srd'))) {
    for (const [k, v] of c.entries) {
      if (v === '') continue;
      const type = c.id.split(':')[1];
      const field = k
        .replace(/\[\d+\]/g, '[#]')
        .split('.')
        .map((seg, i, arr) =>
          type === 'classes' &&
          ['features', 'resources', 'choices', 'subclasses'].includes(arr[i - 2])
            ? '*'
            : seg,
        )
        .join('.');
      const kk = `${type} :: ${field.replace(/^[^.]+\./, (m) => m)}`;
      const e = cnt.get(kk) ?? { n: 0, words: 0, chars: 0 };
      e.n++;
      e.words += words(v);
      e.chars += cp(v);
      cnt.set(kk, e);
    }
  }
  // collapse class paths into field roles
  const roles = new Map();
  for (const [k, e] of cnt) {
    const [type, field] = k.split(' :: ');
    const leaf = field.split('.').pop();
    const role = type === 'classes' ? `classes :: ${leaf}` : `${type} :: ${leaf}`;
    const r = roles.get(role) ?? { n: 0, words: 0, chars: 0 };
    r.n += e.n;
    r.words += e.words;
    r.chars += e.chars;
    roles.set(role, r);
  }
  print('Field role (leaf key name) across both books:');
  print('');
  print(
    table(
      ['Type :: field', 'Strings', 'Words', 'Chars'],
      [...roles.entries()]
        .sort((a, b) => b[1].words - a[1].words)
        .map(([k, e]) => [k, e.n, e.words, e.chars]),
    ),
  );
  print('');
}

// ---------- 4. must-preserve tokens & ICU ----------
{
  print('## C. Must-preserve tokens');
  print('');
  const ui = corpora.find((c) => c.id === 'ui');
  const uiStrs = nonEmpty(ui.entries);
  const icu = {
    'strings with {var} placeholder (any)': uiStrs.filter((s) => /\{\s*\w+\s*\}/.test(s)).length,
    'strings with plural': uiStrs.filter((s) => /,\s*plural\s*,/.test(s)).length,
    'strings with select': uiStrs.filter((s) => /,\s*select\s*,/.test(s)).length,
    'strings with selectordinal': uiStrs.filter((s) => /,\s*selectordinal\s*,/.test(s)).length,
    'strings with rich-text tags <x>': uiStrs.filter((s) => /<\/?[a-zA-Z][^>]*>/.test(s)).length,
    "strings with ICU apostrophe-escape (') next to { or }": uiStrs.filter((s) => /'[{}]/.test(s))
      .length,
    'strings with "#" inside a plural': uiStrs.filter((s) => /plural[^]*#/.test(s)).length,
    'strings with a literal newline': uiStrs.filter((s) => s.includes('\n')).length,
    'strings with markdown-ish **/[]()': uiStrs.filter((s) => /\*\*|\]\(/.test(s)).length,
  };
  const uniqueVars = new Set();
  const tagNames = new Map();
  for (const s of uiStrs) {
    for (const m of s.matchAll(/\{\s*([a-zA-Z_]\w*)\s*[,}]/g)) uniqueVars.add(m[1]);
    for (const m of s.matchAll(/<\/?([a-zA-Z][\w-]*)/g))
      tagNames.set(m[1], (tagNames.get(m[1]) ?? 0) + 1);
  }
  print(
    'UI (messages/en.json), ICU / rich-text usage (measured, regex-based; a plural counts once even if nested):',
  );
  print('');
  print(table(['Pattern', 'Strings'], Object.entries(icu)));
  print('');
  print(
    `Distinct argument names used: ${uniqueVars.size}. Rich-text tag names (occurrences): ${[...tagNames.entries()].map(([k, v]) => `${k}=${v}`).join(', ') || 'none'}.`,
  );
  print('');
  // Content tokens
  const srdStrs = corpora.filter((c) => c.id.startsWith('srd')).flatMap((c) => nonEmpty(c.entries));
  const tag = new Map();
  let dice = 0;
  let tagsTotal = 0;
  let tagStringsCount = 0;
  let displayOverrides = 0;
  let tables = 0;
  let bullets = 0;
  let newlines = 0;
  for (const s of srdStrs) {
    let hasTag = false;
    for (const m of s.matchAll(/\{@(\w+) ([^}]*)\}/g)) {
      hasTag = true;
      tagsTotal++;
      tag.set(m[1], (tag.get(m[1]) ?? 0) + 1);
      if (m[2].split('|').length >= 3 && m[2].split('|')[2] !== '') displayOverrides++;
    }
    if (hasTag) tagStringsCount++;
    dice += (s.match(/\b\d+d\d+\b/g) ?? []).length;
    tables += (s.match(/^\|.*\|$/gm) ?? []).length;
    bullets += (s.match(/^•/gm) ?? []).length;
    newlines += (s.match(/\n/g) ?? []).length;
  }
  print('SRD content (en, both books), Foundry/5etools-style tags and formatting inside strings:');
  print('');
  print(
    table(
      ['Item', 'Count'],
      [
        ['strings containing at least one {@tag ...}', tagStringsCount],
        ['{@tag ...} occurrences', tagsTotal],
        ['of which with a 3rd segment (display-text override, translatable)', displayOverrides],
        ['bare dice expressions (NdM, incl. inside {@damage}/{@dice})', dice],
        ['Markdown table lines (^|...|$)', tables],
        ['bullet lines (starting with •)', bullets],
        ['newline characters inside strings', newlines],
      ],
    ),
  );
  print('');
  print(
    'Tag types (occurrences): ' +
      [...tag.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
  );
  print('');
}

// ---------- 5. coverage per language ----------
print('## D. Coverage per target language');
print('');
print(
  'Per category, relative to the English keys (en = 100%). translated = key present with non-empty text; empty = key present with ""; missing = key absent. "same as en" = translated text identical to the English (a copy or a legitimately identical proper noun; a subset of translated). Words are English words of the covered keys.',
);
print('');
const covRows = [];
const covResults = [];
const parity = [];
const parityExamples = [];
for (const c of corpora.filter((c) => targetsOf[c.id])) {
  for (const l of LANGS) {
    const tgt = targetsOf[c.id][l];
    let tr = 0,
      em = 0,
      mi = 0,
      same = 0,
      wTr = 0,
      wAll = 0;
    let pb = 0; // parity breaks
    let outlier = 0;
    for (const [k, src] of c.entries) {
      if (src === '') continue;
      const w = words(src);
      wAll += w;
      if (!tgt.has(k)) mi++;
      else if (tgt.get(k) === '') em++;
      else {
        tr++;
        wTr += w;
        if (tgt.get(k) === src) same++;
        const t = tgt.get(k);
        const sig = (s) =>
          [
            (s.match(/\b\d+d\d+\b/g) ?? []).sort().join(','),
            (s.match(/\{@(\w+)/g) ?? []).sort().join(','),
            (s.match(/\{\s*[a-zA-Z_]\w*\s*[,}]/g) ?? [])
              .map((x) => x.replace(/[\s,}{]/g, ''))
              .sort()
              .join(','),
            (s.match(/<\/?[a-zA-Z][\w-]*>/g) ?? []).sort().join(','),
          ].join('|');
        if (sig(src) !== sig(t)) {
          pb++;
          if (parityExamples.length < 12) parityExamples.push(`${c.id}/${l}/${k}`);
        }
        const ratio = cp(t) / Math.max(1, cp(src));
        if (cp(src) >= 80 && (ratio < 0.5 || ratio > 2.0)) outlier++;
      }
    }
    const total = tr + em + mi;
    covRows.push([c.label, l, total, tr, em, mi, pct(tr, total), same, pct(wTr, wAll)]);
    covResults.push({
      category: c.label,
      lang: l,
      total,
      translated: tr,
      empty: em,
      missing: mi,
      same,
      wTr,
      wAll,
    });
    parity.push([c.label, l, tr, pb, outlier]);
  }
}
print(
  table(
    [
      'Category',
      'Lang',
      'en keys',
      'Translated',
      'Empty',
      'Missing',
      '% keys translated',
      'Same as en',
      '% en words covered',
    ],
    covRows,
  ),
);
results.coverage = covResults;
print('');
print(
  'Roll-up per language (all categories with a translation structure: UI + SRD 5.1 + SRD 5.2; docs/markdown have no translations):',
);
print('');
{
  const roll = [];
  for (const l of LANGS) {
    const rs = covResults.filter((r) => r.lang === l);
    const tot = sum(rs.map((r) => r.total));
    const tr = sum(rs.map((r) => r.translated));
    const wT = sum(rs.map((r) => r.wTr));
    const wA = sum(rs.map((r) => r.wAll));
    roll.push([
      l,
      tot,
      tr,
      sum(rs.map((r) => r.empty)),
      sum(rs.map((r) => r.missing)),
      pct(tr, tot),
      wT,
      wA - wT,
      pct(wT, wA),
    ]);
  }
  print(
    table(
      [
        'Lang',
        'en keys',
        'Translated',
        'Empty',
        'Missing',
        '% keys translated',
        'en words translated',
        'en words still to translate',
        '% words translated',
      ],
      roll,
    ),
  );
}
print('');
print(
  'Cheap quality/staleness proxies among TRANSLATED keys (not proof of error): "parity breaks" = the translation differs from the English in the multiset of dice expressions, {@tags}, ICU {args} or <rich> tags; "length outliers" = English >= 80 chars and translated length < 0.5x or > 2.0x of it (possible truncation or stale text).',
);
print('');
print(
  table(
    ['Category', 'Lang', 'Translated', 'Parity breaks', 'Length outliers'],
    parity.filter((r) => r[2] > 0),
  ),
);
print('');
print('First parity-break keys (for manual inspection): ' + parityExamples.join('; '));
print('');
print(
  'Coverage by field role (leaf key name), SRD only, both books (en keys = non-empty English strings):',
);
print('');
{
  const rows = [];
  const roles = new Map();
  for (const c of corpora.filter((c) => c.id.startsWith('srd'))) {
    const type = c.id.split(':')[1];
    for (const [k, src] of c.entries) {
      if (!src) continue;
      const leaf = k.split('.').pop();
      const role = `${type} :: ${leaf}`;
      const r = roles.get(role) ?? { n: 0, pt: 0, es: 0, sv: 0 };
      r.n++;
      for (const l of LANGS) if ((targetsOf[c.id][l].get(k) ?? '') !== '') r[l]++;
      roles.set(role, r);
    }
  }
  for (const [role, r] of [...roles.entries()].sort((a, b) => b[1].n - a[1].n))
    rows.push([
      role,
      r.n,
      `${r.pt} (${pct(r.pt, r.n)})`,
      `${r.es} (${pct(r.es, r.n)})`,
      `${r.sv} (${pct(r.sv, r.n)})`,
    ]);
  print(table(['Field', 'en keys', 'pt translated', 'es translated', 'sv translated'], rows));
}
print('');

// Measured expansion ratios (pairs where both are non-empty and not identical)
const ratios = {};
for (const l of LANGS) {
  let a = 0,
    b = 0,
    wa = 0,
    wb = 0;
  for (const c of corpora.filter((c) => targetsOf[c.id])) {
    for (const [k, src] of c.entries) {
      const t = targetsOf[c.id][l].get(k);
      if (!src || !t || t === src) continue;
      a += cp(src);
      b += cp(t);
      wa += words(src);
      wb += words(t);
    }
  }
  ratios[l] = { charRatio: a ? b / a : null, wordRatio: wa ? wb / wa : null, pairedChars: a };
}
print('Measured expansion on translated pairs (target/en; excludes identical and empty pairs):');
print('');
print(
  table(
    ['Lang', 'Paired en chars', 'Chars ratio', 'Words ratio'],
    LANGS.map((l) => [
      l,
      ratios[l].pairedChars,
      ratios[l].charRatio?.toFixed(3) ?? 'n/a',
      ratios[l].wordRatio?.toFixed(3) ?? 'n/a',
    ]),
  ),
);
print('');
results.ratios = ratios;

// ---------- 6. duplicates ----------
print('## E. Duplicates (English source)');
print('');
{
  const index = new Map(); // string -> Set(category label)
  for (const c of corpora.filter((c) => c.id === 'ui' || c.id.startsWith('srd'))) {
    for (const s of nonEmpty(c.entries)) {
      if (!index.has(s)) index.set(s, new Set());
      index.get(s).add(c.id);
    }
  }
  const crossRows = [];
  const pairs = [];
  for (const [s, set] of index) if (set.size > 1) pairs.push([s, [...set]]);
  const long = pairs.filter(([s]) => s.length >= 40);
  print(
    `Distinct strings in the product corpus: ${fmt(index.size)}; present in more than one category: ${fmt(pairs.length)} (${fmt(sum(pairs.map(([s]) => words(s))))} words once); of those >= 40 chars: ${fmt(long.length)} (${fmt(sum(long.map(([s]) => words(s))))} words once).`,
  );
  print('');
  const ids = corpora.filter((c) => c.id === 'ui' || c.id.startsWith('srd')).map((c) => c.id);
  const pairCount = new Map();
  for (const [s, set] of index) {
    const arr = [...set].sort();
    for (let i = 0; i < arr.length; i++)
      for (let j = i + 1; j < arr.length; j++) {
        const key = `${arr[i]} <-> ${arr[j]}`;
        const e = pairCount.get(key) ?? { n: 0, w: 0, nLong: 0, wLong: 0 };
        e.n++;
        e.w += words(s);
        if (s.length >= 40) {
          e.nLong++;
          e.wLong += words(s);
        }
        pairCount.set(key, e);
      }
  }
  void ids;
  for (const [k, e] of [...pairCount.entries()].sort((a, b) => b[1].w - a[1].w).slice(0, 14))
    crossRows.push([k, e.n, e.w, e.nLong, e.wLong]);
  print('Category pairs sharing identical strings (top by words; "long" = >= 40 chars):');
  print('');
  print(table(['Pair', 'Shared strings', 'Words', 'Shared (long)', 'Words (long)'], crossRows));
  print('');
  // within-category duplicates
  print('Duplicates inside each category (strings that repeat with the same text):');
  print('');
  print(
    table(
      ['Category', 'Strings', 'Unique', 'Repeated strings', 'Words saved by dedup'],
      corpora
        .filter((c) => c.id === 'ui' || c.id.startsWith('srd'))
        .map((c) => [
          c.label,
          c.stats.strings,
          c.stats.unique,
          c.stats.strings - c.stats.unique,
          c.stats.words - c.stats.uniqueWords,
        ]),
    ),
  );
  print('');
  // 5.1 vs 5.2 by id
  print('SRD 5.1 vs 5.2, same entry id (spells/items/conditions/classes), English text:');
  print('');
  const rows = [];
  for (const t of TYPES) {
    const a = corpora.find((c) => c.id === `srd51:${t}`).entries;
    const b = corpora.find((c) => c.id === `srd52:${t}`).entries;
    let both = 0,
      ident = 0,
      wIdent = 0,
      wBoth = 0,
      near = 0,
      wNear = 0;
    for (const [k, va] of a) {
      const vb = b.get(k);
      if (vb === undefined || va === '' || vb === '') continue;
      both++;
      wBoth += words(vb);
      if (va === vb) {
        ident++;
        wIdent += words(vb);
      } else {
        const j = jaccardWords(va, vb);
        if (j >= 0.8) {
          near++;
          wNear += words(vb);
        }
      }
    }
    rows.push([t, a.size, b.size, both, ident, wIdent, near, wNear, wBoth]);
  }
  print(
    table(
      [
        'Type',
        'Keys 5.1',
        'Keys 5.2',
        'Same key in both',
        'Identical',
        'Words identical',
        'Near (Jaccard>=0.8 of word sets)',
        'Words near',
        'Words (5.2 side) of shared keys',
      ],
      rows,
    ),
  );
  print('');
  results.dup51v52 = rows;
}

function jaccardWords(a, b) {
  const A = new Set(a.toLowerCase().split(/\W+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\W+/).filter(Boolean));
  let i = 0;
  for (const x of A) if (B.has(x)) i++;
  return i / (A.size + B.size - i || 1);
}

// near-duplicates over the whole product corpus
{
  print(
    'Near-duplicates (method: lowercased 4-word shingles of strings with >= 8 words; candidate pairs found through an inverted index (shingles with document frequency <= 200); Jaccard on shingle sets; exact duplicates excluded). Different keys only.',
  );
  print('');
  const items = [];
  const seen = new Set();
  for (const c of corpora.filter((c) => c.id === 'ui' || c.id.startsWith('srd'))) {
    for (const [k, s] of c.entries) {
      if (s === '' || words(s) < 8 || seen.has(s)) continue; // exact dups removed: one representative
      seen.add(s);
      const toks = s
        .toLowerCase()
        .replace(/\{@\w+ ([^}|]*)[^}]*\}/g, '$1')
        .split(/\W+/)
        .filter(Boolean);
      const sh = new Set();
      for (let i = 0; i + 4 <= toks.length; i++) sh.add(toks.slice(i, i + 4).join(' '));
      if (sh.size) items.push({ id: `${c.id}:${k}`, cat: c.id, w: words(s), sh });
    }
  }
  const inv = new Map();
  items.forEach((it, idx) => {
    for (const s of it.sh) {
      if (!inv.has(s)) inv.set(s, []);
      inv.get(s).push(idx);
    }
  });
  const thresholds = [0.9, 0.8, 0.7];
  const hit = Object.fromEntries(thresholds.map((t) => [t, new Set()]));
  const pairsAt = Object.fromEntries(thresholds.map((t) => [t, 0]));
  const crossCat = { 0.8: 0 };
  for (let i = 0; i < items.length; i++) {
    const counts = new Map();
    for (const s of items[i].sh) {
      const lst = inv.get(s);
      if (lst.length > 200) continue;
      for (const j of lst) if (j > i) counts.set(j, (counts.get(j) ?? 0) + 1);
    }
    for (const [j, n] of counts) {
      if (n < 2) continue;
      const a = items[i].sh,
        b = items[j].sh;
      const jac = n / (a.size + b.size - n);
      for (const t of thresholds)
        if (jac >= t) {
          pairsAt[t]++;
          hit[t].add(i);
          hit[t].add(j);
        }
      if (jac >= 0.8 && items[i].cat !== items[j].cat) crossCat[0.8]++;
    }
  }
  print(
    `Strings compared (>= 8 words, exact-dedup'd): ${fmt(items.length)} (${fmt(sum(items.map((i) => i.w)))} words).`,
  );
  print('');
  print(
    table(
      ['Jaccard >=', 'Near-duplicate pairs', 'Strings with >= 1 partner', 'Words in those strings'],
      thresholds.map((t) => [t, pairsAt[t], hit[t].size, sum([...hit[t]].map((i) => items[i].w))]),
    ),
  );
  print('');
  print(
    `Of the pairs at >= 0.8, across different categories: ${fmt(crossCat[0.8])}. Note: spells in 5.1 vs 5.2 are the main source; strings that are near-identical are candidates for translation-memory fuzzy matches, not for removal.`,
  );
  print('');
  results.nearDup = { compared: items.length, pairsAt };
}

// ---------- 7. git history ----------
function safeGit(a, opts = {}) {
  try {
    return execFileSync('git', a, {
      cwd: ROOT,
      encoding: 'utf8',
      maxBuffer: 1 << 28,
      stdio: ['ignore', 'pipe', 'ignore'],
      ...opts,
    }).trim();
  } catch {
    return '';
  }
}
function replay(file) {
  // chronological commits that touched `file` (first-parent)
  const out = safeGit(['log', '--first-parent', '--reverse', '--format=%H%x09%cI', '--', file]);
  const commits = out ? out.split('\n').map((l) => l.split('\t')) : [];
  let prev = new Map();
  const events = [];
  const last = new Map(); // key -> ISO date of last value change
  for (const [sha, date] of commits) {
    let cur = new Map();
    const raw = safeGit(['show', `${sha}:${file}`]);
    if (raw) {
      try {
        cur = flatten(JSON.parse(raw));
      } catch {
        cur = new Map();
      }
    }
    const ev = {
      sha: sha.slice(0, 8),
      date,
      addedKeys: 0,
      addedWords: 0,
      changedKeys: 0,
      changedWords: 0,
      removedKeys: 0,
    };
    for (const [k, v] of cur) {
      const p = prev.get(k);
      if (v === '') continue;
      if (p === undefined || p === '') {
        ev.addedKeys++;
        ev.addedWords += words(v);
        last.set(k, date);
      } else if (p !== v) {
        ev.changedKeys++;
        ev.changedWords += words(v);
        last.set(k, date);
      }
    }
    for (const [k, p] of prev) if (p !== '' && (!cur.has(k) || cur.get(k) === '')) ev.removedKeys++;
    events.push(ev);
    prev = cur;
  }
  return { commits: commits.length, events, last, final: prev };
}

if (!NO_GIT) {
  print('## F. Git history of the English source files');
  print('');
  print(
    `Repository: ${safeGit(['rev-list', '--count', 'HEAD'])} commits on HEAD, root commit date ${safeGit(['log', '--format=%cI', '--reverse']).split('\n')[0]}.`,
  );
  const firstContent = safeGit([
    'log',
    '--first-parent',
    '--reverse',
    '--format=%cI %h %s',
    '--',
    'content/dnd5e/srd-5.1/i18n/en/spells.json',
  ]).split('\n')[0];
  print(`First commit touching content/dnd5e/srd-5.1/i18n/en/spells.json: ${firstContent}`);
  print('');
  print(
    'Method: for each file, replay `git log --first-parent --reverse -- <file>`; compare the flattened key->string maps of consecutive versions. "added" = key new or previously empty; "changed" = non-empty value that differs; words = words of the NEW value. Date = committer date (squash-merge date, i.e. when it reached main). Commits of the importer/Crowdin/Weblate are counted like any other: see the noise notes in the docs.',
  );
  print('');
  const enFiles = { ui: ['messages/en.json'] };
  enFiles.content = [];
  for (const b of BOOKS)
    for (const t of TYPES) enFiles.content.push(`content/dnd5e/srd-${b}/i18n/en/${t}.json`);
  const hist = {};
  for (const [grp, files] of Object.entries(enFiles)) {
    const monthly = new Map();
    const commitsAll = [];
    let nCommits = 0;
    for (const f of files) {
      const r = replay(f);
      nCommits += r.commits;
      for (const ev of r.events) {
        const m = ev.date.slice(0, 7);
        const e = monthly.get(m) ?? {
          addedKeys: 0,
          addedWords: 0,
          changedKeys: 0,
          changedWords: 0,
          removedKeys: 0,
          commits: new Set(),
        };
        e.addedKeys += ev.addedKeys;
        e.addedWords += ev.addedWords;
        e.changedKeys += ev.changedKeys;
        e.changedWords += ev.changedWords;
        e.removedKeys += ev.removedKeys;
        e.commits.add(ev.sha);
        monthly.set(m, e);
        commitsAll.push({ file: f, ...ev });
      }
    }
    hist[grp] = { monthly, commitsAll, nCommits };
    print(
      `### ${grp === 'ui' ? 'UI: messages/en.json' : 'Content: 8 files srd-{5.1,5.2}/i18n/en/*.json'} (${nCommits} file-commits)`,
    );
    print('');
    const months = [...monthly.keys()].sort();
    print(
      table(
        [
          'Month',
          'Commits',
          'Keys added',
          'Words added',
          'Keys changed',
          'Words changed',
          'Keys removed',
        ],
        months.map((m) => {
          const e = monthly.get(m);
          return [
            m,
            e.commits.size,
            e.addedKeys,
            e.addedWords,
            e.changedKeys,
            e.changedWords,
            e.removedKeys,
          ];
        }),
      ),
    );
    print('');
    const top = [...commitsAll]
      .sort((a, b) => b.addedWords + b.changedWords - (a.addedWords + a.changedWords))
      .slice(0, 5);
    if (grp === 'content') {
      print(
        'Every file-commit of the content source files (the content grows in import events, not steadily):',
      );
      print('');
      print(
        table(
          ['Date', 'SHA', 'File', 'Keys added', 'Words added', 'Keys changed', 'Words changed'],
          commitsAll
            .filter((e) => e.addedKeys + e.changedKeys > 0)
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((e) => [
              e.date.slice(0, 10),
              e.sha,
              e.file.replace('content/dnd5e/', '').replace('/i18n/en', ''),
              e.addedKeys,
              e.addedWords,
              e.changedKeys,
              e.changedWords,
            ]),
        ),
      );
      print('');
    }
    print(
      'Largest single commits (words added+changed): ' +
        top
          .map(
            (t) =>
              `${t.sha} ${t.date.slice(0, 10)} ${path.basename(t.file)} +${t.addedWords}/~${t.changedWords}`,
          )
          .join('; '),
    );
    print('');
    const flow = months.map((m) => monthly.get(m).addedWords + monthly.get(m).changedWords);
    const sorted = [...flow].sort((a, b) => a - b);
    const total = sum(flow);
    print(
      `Words added+changed per month over ${months.length} calendar months with activity: total ${fmt(total)}, mean ${fmt(total / months.length)}, median ${fmt(quantile(sorted, 0.5))}, max ${fmt(sorted.at(-1) ?? 0)}.`,
    );
    // last 3 full months
    print('');
    results[`growth_${grp}`] = months.map((m) => [
      m,
      monthly.get(m).addedWords,
      monthly.get(m).changedWords,
    ]);
  }

  // Staleness: en last change vs target last change
  print('### Possibly outdated translations (git-based proxy)');
  print('');
  print(
    'A translated key is flagged "possibly outdated" when the English value of that key last changed AFTER the translation last changed (per-key replay of both files; same-commit changes are not flagged). Limits: a pure English typo fix flags a still-valid translation; a translation edited for another reason hides staleness; commits are squash dates, so a Weblate PR lagging a source change can flag a key that was in fact translated from the new text.',
  );
  print('');
  const staleRows = [];
  const pairsList = [['messages/en.json', (l) => `messages/${l}.json`, 'UI']];
  for (const b of BOOKS)
    for (const t of TYPES)
      pairsList.push([
        `content/dnd5e/srd-${b}/i18n/en/${t}.json`,
        (l) => `content/dnd5e/srd-${b}/i18n/${l}/${t}.json`,
        `srd-${b} ${t}`,
      ]);
  const tot = Object.fromEntries(LANGS.map((l) => [l, { translated: 0, stale: 0, staleWords: 0 }]));
  for (const [enFile, tgtOf, label] of pairsList) {
    const en = replay(enFile);
    for (const l of LANGS) {
      const tr = replay(tgtOf(l));
      let n = 0,
        stale = 0,
        sw = 0;
      for (const [k, v] of tr.final) {
        if (v === '' || !en.final.has(k)) continue;
        n++;
        const de = en.last.get(k),
          dt = tr.last.get(k);
        if (de && dt && de > dt) {
          stale++;
          sw += words(en.final.get(k));
        }
      }
      tot[l].translated += n;
      tot[l].stale += stale;
      tot[l].staleWords += sw;
      if (n > 0) staleRows.push([label, l, n, stale, pct(stale, n), sw]);
    }
  }
  print(
    table(
      ['Category', 'Lang', 'Translated keys', 'Possibly outdated', '%', 'Words (en side)'],
      staleRows,
    ),
  );
  print('');
  print(
    table(
      ['Lang', 'Translated keys', 'Possibly outdated', '%'],
      LANGS.map((l) => [l, tot[l].translated, tot[l].stale, pct(tot[l].stale, tot[l].translated)]),
    ),
  );
  print('');
  results.stale = staleRows;
  results.hist = Object.fromEntries(
    Object.entries(hist).map(([k, v]) => [
      k,
      [...v.monthly.entries()].map(([m, e]) => ({ m, ...e, commits: e.commits.size })),
    ]),
  );
}

// ---------- 8. projections ----------
print('## G. Projections (ARITHMETIC, not measurements)');
print('');
{
  const prod = groupRows[3]; // [label, files, strings, unique, words, chars, tokens, uWords, uChars]
  const withDocs = (() => {
    const cs = corpora.filter(
      (c) =>
        c.id === 'ui' ||
        c.id.startsWith('srd') ||
        c.group === 'Docs under docs/' ||
        ['root-md', 'agents-md', 'public-txt'].includes(c.id),
    );
    const st = stats(cs.flatMap((c) => nonEmpty(c.entries)));
    return ['PRODUCT + docs/ + root/.agents/.github md + llms.txt', st.words, st.chars];
  })();
  const bases = [
    ['PRODUCT CORPUS (UI + SRD 5.1 + 5.2), all strings, no dedup', prod[4], prod[5]],
    ['PRODUCT CORPUS, unique strings only (exact dedup across the corpus)', prod[7], prod[8]],
    withDocs,
  ];
  const ratioFor = {
    pt: ratios.pt.charRatio ?? 1.15,
    es: ratios.es.charRatio ?? 1.15,
    sv: SV_CHAR_RATIO_ASSUMED,
  };
  const avgRatio = (ratioFor.pt + ratioFor.es) / 2;
  const wordRatio = ((ratios.pt.wordRatio ?? 1.1) + (ratios.es.wordRatio ?? 1.1)) / 2;
  const tokPerChar = 1 / ((CHARS_PER_TOKEN.pt + CHARS_PER_TOKEN.es) / 2);
  print(
    `Assumptions: output chars per language = source chars x ${avgRatio.toFixed(3)} (mean of measured pt and es char ratios); output words = source words x ${wordRatio.toFixed(3)} (measured); output tokens = output chars / ${((CHARS_PER_TOKEN.pt + CHARS_PER_TOKEN.es) / 2).toFixed(1)} (heuristic for pt/es); input tokens = source chars / ${CHARS_PER_TOKEN.en} and the source is re-sent once per target language (no batching of languages). Content multiplier scales the SOURCE. N languages = N independent full translations from scratch (existing human translations NOT deducted).`,
  );
  print('');
  const mults = [1, 2, 5, 10];
  const langs = [2, 5, 10, 20];
  for (const [label, w, ch] of bases) {
    print(`### Base: ${label} (source: ${fmt(w)} words, ${fmt(ch)} chars)`);
    print('');
    const rows = [];
    for (const m of mults) {
      for (const n of langs) {
        const outW = w * m * n * wordRatio;
        const outC = ch * m * n * avgRatio;
        const outT = outC * tokPerChar;
        const inT = ((ch * m) / CHARS_PER_TOKEN.en) * n;
        rows.push([
          `${m}x`,
          n,
          Math.round(w * m),
          Math.round(outW),
          Math.round(outC),
          Math.round(inT),
          Math.round(outT),
        ]);
      }
    }
    print(
      table(
        [
          'Content',
          'Target langs',
          'Source words',
          'Output words',
          'Output chars',
          'Input tokens (ESTIMATE)',
          'Output tokens (ESTIMATE)',
        ],
        rows,
      ),
    );
    print('');
  }
  results.projectionBases = bases;
}

if (JSON_OUT) writeFileSync(JSON_OUT, JSON.stringify(results, null, 2));

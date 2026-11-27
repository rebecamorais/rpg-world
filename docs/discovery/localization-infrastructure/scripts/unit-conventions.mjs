#!/usr/bin/env node
// Measures how the approved pt (and es, pt-5.2) rules content converts imperial units.
// No dependencies. Run from the repo root:
//   node docs/discovery/localization-infrastructure/scripts/unit-conventions.mjs
// Prints markdown-ish tables to stdout. Reads content/dnd5e/srd-*/i18n/** and messages/*.json
// (read-only). Nothing is written.
//
// Method in one paragraph: every string field of en and the target language is flattened to a
// path key (e.g. "spells:acid-splash/description"). Tags such as {@condition a||b} are replaced
// by their display text. In the target text, bracketed leftovers "[20-foot cube]" are removed
// before extraction. Measurements are extracted with one regex per language, in text order. When
// a pair has the same number of measurements on both sides they are paired by position
// ("aligned"); otherwise the pair is reported as "unaligned" and never enters the value tables.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const FILES = ['spells', 'items', 'conditions', 'classes'];

// ---------------------------------------------------------------- loading

function flatten(obj, prefix = '', out = {}) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}/${k}` : k;
    if (typeof v === 'string') out[key] = v;
    else if (Array.isArray(v))
      v.forEach((x, i) =>
        typeof x === 'string' ? (out[`${key}[${i}]`] = x) : flatten(x, `${key}[${i}]`, out),
      );
    else if (v && typeof v === 'object') flatten(v, key, out);
  }
  return out;
}

function loadLang(edition, lang) {
  const all = {};
  for (const f of FILES) {
    const p = path.join(ROOT, 'content/dnd5e', edition, 'i18n', lang, `${f}.json`);
    const flat = flatten(JSON.parse(fs.readFileSync(p, 'utf8')));
    for (const [k, v] of Object.entries(flat)) all[`${f}:${k}`] = v;
  }
  return all;
}

/** Pairs where both sides are non-empty and the target differs from en (i.e. translated). */
function pairsOf(en, tgt) {
  const pairs = [];
  let missing = 0,
    empty = 0,
    same = 0;
  for (const [k, e] of Object.entries(en)) {
    if (!(k in tgt)) {
      missing++;
      continue;
    }
    const t = tgt[k];
    if (!t || !e) {
      empty++;
      continue;
    }
    if (t === e) {
      same++;
      continue;
    }
    pairs.push({ key: k, en: e, tgt: t });
  }
  return {
    pairs,
    stats: { keys: Object.keys(en).length, translated: pairs.length, missing, empty, same },
  };
}

// ---------------------------------------------------------------- tags and brackets

const TAG_RE = /\{@(\w+)\s*([^}]*)\}/g;

function stripTags(s) {
  return s.replace(TAG_RE, (_, _t, body) => {
    const parts = body.split('|');
    return parts[2] !== undefined && parts[2] !== '' ? parts[2] : parts[0];
  });
}

function stripBrackets(s) {
  return s.replace(/\s*\[[^\]]*\]/g, '');
}

const BRACKET_RE = /\[[^\]]*\]/g;

// ---------------------------------------------------------------- extractors

const UNI_FR = '½⅓⅔¼¾⅕⅖⅗⅘⅙⅛';
const UNI_VAL = {
  '½': 0.5,
  '⅓': 1 / 3,
  '⅔': 2 / 3,
  '¼': 0.25,
  '¾': 0.75,
  '⅕': 0.2,
  '⅖': 0.4,
  '⅗': 0.6,
  '⅘': 0.8,
  '⅙': 1 / 6,
  '⅛': 0.125,
};
const NUM_EN = String.raw`(?:\d*[${UNI_FR}]|\d{1,3}(?:,\d{3})+|\d+(?:\.\d+)?(?:\/\d+)?)`;
const EN_UNITS = String.raw`feet|foot|ft\.?|miles?|pounds?|lbs?\.?|inch(?:es)?|gallons?|ounces?|yards?|yd\.?|pints?|quarts?|mph`;
const EN_RE = new RegExp(
  String.raw`(?<![\w/])(?<n1>${NUM_EN})(?:(?<j>-by-|\s+by\s+|\s*x\s*|-to-|\s+to\s+|\s+or\s+)(?<n2>${NUM_EN}))?(?:-|\s+)(?:(?<mod>cubic|square|sq\.?)(?:-|\s+))?(?<u>${EN_UNITS})(?![A-Za-z])`,
  'gi',
);
// no-digit forms: "half-mile", "a/one mile", "every foot", "per foot", "an extra foot"
const EN_IMPLIED_RE =
  /(?<![\w-])(?:(?<half>half)[- ](?<uh>mile|foot|inch|pound|gallon)|(?:(?:an?|one)\s+(?:extra\s+|additional\s+)?|(?:every|per|each)\s+)(?<u1>mile|foot|inch|pound|gallon|ounce|yard|pint))(?![A-Za-z])/gi;

const NUM_PT = String.raw`\d+(?:[.,]\d+)*`;
const PT_UNITS = String.raw`(?:metros?|m|km|cm)\s?[²³]|metros?\s+quadrados?|metros?\s+c[úu]bicos?|p[ée]s\s+quadrados?|p[ée]s\s+c[úu]bicos?|jardas?\s+quadradas?|jardas?\s+c[úu]bicas?|cent[ií]metros?|mililitros?|quil[oô]metros?|quilogramas?|quilos?|metros?|litros?|gramas?|p[ée]s?|milhas?|libras?|polegadas?|jardas?|gal(?:ões|oes|ão|ao)|on[cç]as?|pintas?|ft\.?|km|kg|cm|ml|mph|lb|m|g|l`;
const ES_UNITS = String.raw`(?:metros?|m|km|cm)\s?[²³]|metros?\s+cuadrados?|metros?\s+c[úu]bicos?|pies\s+cuadrados?|pies\s+c[úu]bicos?|yardas?\s+cuadradas?|cent[ií]metros?|mililitros?|kil[óo]metros?|kilogramos?|kilos?|metros?|litros?|gramos?|pies?|millas?|libras?|pulgadas?|yardas?|galones|gal[óo]n|onzas?|pintas?|cuartos?|ft\.?|km|kg|cm|ml|mph|lb|m|g|l`;
const SV_UNITS = String.raw`meter|kilometer|kilo|kg|km|cm|m|fot|fötter|fots|mil|mile|miles|pund|tum|gallon|uns|yard|liter`;

function ptRe(units, joiners) {
  return new RegExp(
    String.raw`(?<![\p{L}\d/.,])(?<n1>${NUM_PT})(?:(?<j>\s+(?:${joiners})\s+|\s*x\s*|-)(?<n2>${NUM_PT}))?\s*(?<u>${units})(?![\p{L}])`,
    'giu',
  );
}
const TGT_RE = {
  pt: ptRe(PT_UNITS, 'a|ou|por|x|e'),
  es: ptRe(ES_UNITS, 'a|o|por|x|y'),
  sv: ptRe(SV_UNITS, 'till|eller|x|gånger'),
};

function canonEnUnit(u) {
  u = u.toLowerCase().replace(/\.$/, '');
  if (/^(feet|foot|ft)$/.test(u)) return 'ft';
  if (/^miles?$/.test(u)) return 'mi';
  if (/^(pounds?|lbs?)$/.test(u)) return 'lb';
  if (/^inch(es)?$/.test(u)) return 'in';
  if (/^gallons?$/.test(u)) return 'gal';
  if (/^ounces?$/.test(u)) return 'oz';
  if (/^(yards?|yd)$/.test(u)) return 'yd';
  if (/^pints?$/.test(u)) return 'pt';
  if (/^quarts?$/.test(u)) return 'qt';
  if (u === 'mph') return 'mph';
  return u;
}

/** Canonical class of a target-language unit, plus the spelling class (spelled / abbr). */
function canonTgtUnit(u) {
  let s = u.toLowerCase().replace(/\.$/, '').replace(/\s+/g, ' ');
  let mod = '';
  if (/[²]$/.test(s)) ((mod = 'sq '), (s = s.replace(/\s?[²]$/, '')));
  if (/[³]$/.test(s)) ((mod = 'cu '), (s = s.replace(/\s?[³]$/, '')));
  if (/quadrad|cuadrad/.test(s)) mod = 'sq ';
  if (/c[úu]bic/.test(s)) mod = 'cu ';
  const superscript = /[²³]/.test(u);
  const base = s.split(' ')[0];
  let c = base;
  let spelled = true;
  if (/^(metros?|meter)$/.test(base)) c = 'm';
  else if (/^(m)$/.test(base)) ((c = 'm'), (spelled = false));
  else if (/^(kil[óo]metros?|quil[oô]metros?|kilometer)$/.test(base)) c = 'km';
  else if (base === 'km') ((c = 'km'), (spelled = false));
  else if (/^(quilogramas?|kilogramos?|quilos?|kilos?|kilo)$/.test(base)) c = 'kg';
  else if (base === 'kg') ((c = 'kg'), (spelled = false));
  else if (/^mililitros?$/.test(base)) c = 'ml';
  else if (base === 'ml') ((c = 'ml'), (spelled = false));
  else if (/^cent[ií]metros?$/.test(base)) c = 'cm';
  else if (base === 'cm') ((c = 'cm'), (spelled = false));
  else if (/^(gramas?|gramos?)$/.test(base)) c = 'g';
  else if (base === 'g') ((c = 'g'), (spelled = false));
  else if (/^litros?$/.test(base) || base === 'liter') c = 'l';
  else if (base === 'l') ((c = 'l'), (spelled = false));
  else if (/^(p[ée]s?|pies?|pie|fot|fötter|fots)$/.test(base)) c = 'ft';
  else if (base === 'ft') ((c = 'ft'), (spelled = false));
  else if (/^(milhas?|millas?|mil|mile|miles)$/.test(base)) c = 'mi';
  else if (/^(libras?|pund)$/.test(base)) c = 'lb';
  else if (base === 'lb') ((c = 'lb'), (spelled = false));
  else if (/^(polegadas?|pulgadas?|tum)$/.test(base)) c = 'in';
  else if (/^(jardas?|yardas?|yard)$/.test(base)) c = 'yd';
  else if (/^(gal(ões|oes|ão|ao)|galones|gal[óo]n|gallon)$/.test(base)) c = 'gal';
  else if (/^(on[cç]as?|onzas?|uns)$/.test(base)) c = 'oz';
  else if (/^(pintas?)$/.test(base)) c = 'pt';
  else if (/^cuartos?$/.test(base)) c = 'qt';
  else if (base === 'mph') c = 'mph';
  return {
    cls: mod + c,
    base: c,
    spelled,
    form: s + (superscript ? (mod === 'cu ' ? '³' : '²') : ''),
  };
}

const IMPERIAL = new Set(['ft', 'mi', 'lb', 'in', 'gal', 'oz', 'yd', 'pt', 'qt', 'mph']);

function parseEnNum(s) {
  if (s === undefined) return undefined;
  const last = s[s.length - 1];
  if (UNI_VAL[last] !== undefined)
    return (s.length > 1 ? Number(s.slice(0, -1)) : 0) + UNI_VAL[last];
  if (s.includes('/')) {
    const [a, b] = s.split('/');
    return Number(a) / Number(b);
  }
  return Number(s.replace(/,/g, ''));
}

/** Number format of a target-language number string. */
function numFormat(s) {
  if (/^\d+$/.test(s)) return 'integer';
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) return 'thousands-dot';
  if (/^\d+,\d+$/.test(s)) return 'decimal-comma';
  if (/^\d+\.\d+$/.test(s)) return 'decimal-dot';
  return 'other';
}
function parseTgtNum(s) {
  if (s === undefined) return undefined;
  const f = numFormat(s);
  if (f === 'thousands-dot') return Number(s.replace(/\./g, '').replace(',', '.'));
  return Number(s.replace(',', '.'));
}

function extractEn(text) {
  const out = [];
  for (const m of text.matchAll(EN_RE)) {
    const g = m.groups;
    out.push({
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0],
      n1: parseEnNum(g.n1),
      n2: parseEnNum(g.n2),
      join: g.j ? g.j.trim().toLowerCase() : '',
      unit: (g.mod ? (/^c/i.test(g.mod) ? 'cu ' : 'sq ') : '') + canonEnUnit(g.u),
      base: canonEnUnit(g.u),
      hyphenated:
        /^[^\s]+-(?:feet|foot|ft|miles?|pounds?|inch|inches|gallons?|ounces?|yards?|pints?)/i.test(
          m[0],
        ),
      implied: false,
    });
  }
  for (const m of text.matchAll(EN_IMPLIED_RE)) {
    const g = m.groups;
    const u = (g.uh || g.u1).toLowerCase();
    out.push({
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0],
      n1: g.half ? 0.5 : 1,
      n2: undefined,
      join: '',
      unit: canonEnUnit(u),
      base: canonEnUnit(u),
      hyphenated: false,
      implied: true,
    });
  }
  return out.sort((a, b) => a.start - b.start);
}

function extractTgt(text, lang) {
  const re = TGT_RE[lang];
  re.lastIndex = 0;
  const out = [];
  for (const m of text.matchAll(re)) {
    const g = m.groups;
    const cu = canonTgtUnit(g.u);
    out.push({
      start: m.index,
      end: m.index + m[0].length,
      raw: m[0],
      n1raw: g.n1,
      n2raw: g.n2,
      n1: parseTgtNum(g.n1),
      n2: parseTgtNum(g.n2),
      fmt: numFormat(g.n1),
      unit: cu.cls,
      base: cu.base,
      spelled: cu.spelled,
      form: cu.form,
      sep: m[0].slice(g.n1.length + (g.j ? g.j.length + g.n2.length : 0)).match(/^\s*/)[0].length
        ? 'space'
        : 'nospace',
    });
  }
  return out;
}

// ---------------------------------------------------------------- helpers for output

const inc = (m, k, by = 1) => (m[k] = (m[k] || 0) + by);
const sortEntries = (m) =>
  Object.entries(m).sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])));
const fmtNum = (n) => (n === undefined ? '' : String(Math.round(n * 1000) / 1000));
const clip = (s, n = 110) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const snippet = (s, a, b, pad = 35) =>
  s.slice(Math.max(0, a - pad), Math.min(s.length, b + pad)).replace(/\s+/g, ' ');
function h(title, level = 2) {
  console.log(`\n${'#'.repeat(level)} ${title}\n`);
}
function table(headers, rows) {
  console.log(`| ${headers.join(' | ')} |`);
  console.log(`| ${headers.map(() => '---').join(' | ')} |`);
  for (const r of rows) console.log(`| ${r.join(' | ')} |`);
  console.log('');
}
const enValStr = (e) =>
  e.n2 !== undefined ? `${fmtNum(e.n1)} ${e.join} ${fmtNum(e.n2)}` : fmtNum(e.n1);
const tgtValStr = (t) => (t.n2raw !== undefined ? `${t.n1raw}–${t.n2raw}` : t.n1raw);

// ---------------------------------------------------------------- analysis of one language pair

function analyse(pairs, lang) {
  const res = {
    strings: pairs.length,
    stringsWithEn: 0,
    aligned: 0,
    unaligned: [],
    enMeasuresTotal: 0,
    enMeasuresAligned: 0,
    measures: [], // aligned pairs {key, e, t, enText, tgtText, field}
    allTgt: [], // every target measurement (aligned or not), with key
    bracketCmp: { total: 0, same: 0, diff: [], skipped: 0 },
    bracketStrings: 0,
    bracketSegments: 0,
    bracketWithUnit: 0,
    bracketNoUnit: [],
    tagStats: { enTags: 0, tgtTags: 0, enMeasureInTag: [], tgtMeasureInTag: [], tagTypes: {} },
  };
  for (const p of pairs) {
    // tags
    for (const m of p.en.matchAll(TAG_RE)) {
      res.tagStats.enTags++;
      inc(res.tagStats.tagTypes, m[1]);
      const body = m[2].split('|');
      for (const seg of body) {
        if (extractEn(seg).length) {
          res.tagStats.enMeasureInTag.push({ key: p.key, tag: m[0] });
          break;
        }
      }
    }
    for (const m of p.tgt.matchAll(TAG_RE)) {
      res.tagStats.tgtTags++;
      const body = m[2].split('|');
      body.forEach((seg, i) => {
        if (extractTgt(seg, lang).length || extractEn(seg).length)
          res.tagStats.tgtMeasureInTag.push({ key: p.key, tag: m[0], segment: i });
      });
    }
    const enT = stripTags(p.en);
    const rawTgtNoTags = stripTags(p.tgt);
    const brs = [...rawTgtNoTags.matchAll(BRACKET_RE)].map((m) => m[0]);
    if (brs.length) {
      res.bracketStrings++;
      res.bracketSegments += brs.length;
      for (const b of brs) {
        if (
          extractEn(b.slice(1, -1)).length ||
          /\b(feet|foot|ft|miles?|pounds?|inch|inches|gallons?|ounces?|yards?|pints?|square|cubic)\b/i.test(
            b,
          )
        )
          res.bracketWithUnit++;
        else res.bracketNoUnit.push({ key: p.key, b });
      }
    }
    const tgtT = stripBrackets(rawTgtNoTags);
    const E = extractEn(enT);
    const T = extractTgt(tgtT, lang);
    res.enMeasuresTotal += E.length;
    if (E.length) res.stringsWithEn++;
    for (const t of T) res.allTgt.push({ key: p.key, t, text: tgtT });
    if (E.length && E.length === T.length) {
      res.aligned++;
      res.enMeasuresAligned += E.length;
      E.forEach((e, i) =>
        res.measures.push({ key: p.key, e, t: T[i], enText: enT, tgtText: tgtT }),
      );
      // The bracketed English leftovers are the source the translator converted from.
      // Compare them with the real English (en.json) value, position by position.
      const B = [];
      for (const b of brs) for (const x of extractEn(b.slice(1, -1))) B.push(x);
      if (B.length === E.length) {
        E.forEach((e, i) => {
          const b = B[i];
          const same = b.unit === e.unit && b.n1 === e.n1 && b.n2 === e.n2;
          res.bracketCmp.total++;
          if (same) res.bracketCmp.same++;
          else res.bracketCmp.diff.push({ key: p.key, en: e.raw, bracket: b.raw, pt: T[i].raw });
        });
      } else res.bracketCmp.skipped++;
    } else if (E.length || T.length) {
      res.unaligned.push({ key: p.key, E, T, enText: enT, tgtText: tgtT });
    }
  }
  return res;
}

function ratioStr(e, t) {
  if (e.n2 !== undefined || t.n2 !== undefined) return 'range';
  if (!e.n1) return 'n/a';
  return fmtNum(t.n1 / e.n1);
}

/** Table of English value -> target renderings for one English unit class. */
function valueTable(res, enUnit, { listKeys = 2, onlySingle = true } = {}) {
  const byVal = new Map();
  for (const m of res.measures) {
    if (m.e.unit !== enUnit) continue;
    const range = m.e.n2 !== undefined || m.t.n2raw !== undefined;
    if (onlySingle && range) continue;
    if (!onlySingle && !range) continue;
    const v = enValStr(m.e);
    if (!byVal.has(v)) byVal.set(v, { n: 0, rend: new Map() });
    const o = byVal.get(v);
    o.n++;
    const r = `${tgtValStr(m.t)} ${m.t.unit}`;
    if (!o.rend.has(r)) o.rend.set(r, { n: 0, keys: [] });
    const x = o.rend.get(r);
    x.n++;
    if (x.keys.length < listKeys) x.keys.push(m.key);
  }
  const rows = [];
  const sorted = [...byVal.entries()].sort(
    (a, b) => (parseFloat(a[0]) || 0) - (parseFloat(b[0]) || 0),
  );
  for (const [v, o] of sorted) {
    const rend = [...o.rend.entries()].sort((a, b) => b[1].n - a[1].n);
    const flag = rend.length > 1 ? 'SIM' : '';
    rows.push([
      v,
      o.n,
      rend.map(([r, x]) => `${r} (${x.n})`).join('; '),
      flag,
      flag ? rend.map(([r, x]) => `${r}: ${x.keys.join(', ')}`).join(' / ') : '',
    ]);
  }
  return rows;
}

// ================================================================ MAIN

const en51 = loadLang('srd-5.1', 'en');
const pt51 = loadLang('srd-5.1', 'pt');
const { pairs: pairs51pt, stats: st51pt } = pairsOf(en51, pt51);
const R = analyse(pairs51pt, 'pt');

h('0. Base de dados e alinhamento (srd-5.1, en x pt)', 2);
table(
  [
    'chaves en',
    'pares traduzidos (ambos nao vazios, pt != en)',
    'faltando no pt',
    'pt vazio ou en vazio',
    'pt igual a en',
  ],
  [[st51pt.keys, st51pt.translated, st51pt.missing, st51pt.empty, st51pt.same]],
);
table(
  [
    'strings com medida em en',
    'medidas em en (total)',
    'strings alinhadas (mesma contagem)',
    'medidas alinhadas',
    'strings nao alinhadas',
  ],
  [[R.stringsWithEn, R.enMeasuresTotal, R.aligned, R.enMeasuresAligned, R.unaligned.length]],
);
{
  const fields = {};
  for (const m of R.measures)
    inc(
      fields,
      m.key
        .split('/')
        .pop()
        .replace(/\[\d+\]/, ''),
    );
  console.log(
    'Medidas alinhadas por campo: ' +
      sortEntries(fields)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') +
      '\n',
  );
}

// ---- brackets and tags
h('0.1 Sobras em ingles entre colchetes (pt)', 3);
table(
  [
    'strings pt com colchete',
    'segmentos [..]',
    'segmentos com unidade imperial',
    'segmentos sem unidade',
  ],
  [[R.bracketStrings, R.bracketSegments, R.bracketWithUnit, R.bracketNoUnit.length]],
);
if (R.bracketNoUnit.length)
  console.log(
    'Exemplos de colchete sem unidade: ' +
      R.bracketNoUnit
        .slice(0, 8)
        .map((x) => `${x.key} ${x.b}`)
        .join(' | ') +
      '\n',
  );
{
  const per = {};
  for (const p of pairs51pt) if (/\[[^\]]*\]/.test(p.tgt)) inc(per, p.key.split(':')[0]);
  console.log(
    'Strings com colchete por arquivo: ' +
      sortEntries(per)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') +
      '\n',
  );
  const unitsInBr = {};
  for (const p of pairs51pt)
    for (const b of p.tgt.matchAll(BRACKET_RE))
      for (const e of extractEn(b[0].slice(1, -1))) inc(unitsInBr, e.unit);
  console.log(
    'Unidades dentro dos colchetes: ' +
      sortEntries(unitsInBr)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') +
      '\n',
  );
}

console.log(
  `Colchete x en.json (strings alinhadas em que o colchete tem o mesmo numero de medidas): ${R.bracketCmp.total} pares; iguais ${R.bracketCmp.same}; diferentes ${R.bracketCmp.diff.length}; strings puladas (contagens diferentes) ${R.bracketCmp.skipped}`,
);
for (const d of R.bracketCmp.diff)
  console.log(`  - ${d.key}: en "${d.en}" / colchete "${d.bracket}" / pt "${d.pt}"`);
console.log('');

h('0.2 Medidas dentro de tags 5etools', 3);
table(
  [
    'tags en',
    'tags pt',
    'tags en com medida em algum segmento',
    'tags pt com medida em algum segmento',
    'tipos de tag (en)',
  ],
  [
    [
      R.tagStats.enTags,
      R.tagStats.tgtTags,
      R.tagStats.enMeasureInTag.length,
      R.tagStats.tgtMeasureInTag.length,
      sortEntries(R.tagStats.tagTypes)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
    ],
  ],
);
for (const x of [...R.tagStats.enMeasureInTag, ...R.tagStats.tgtMeasureInTag].slice(0, 10))
  console.log(`  - ${x.key}: ${x.tag} (segmento ${x.segment ?? 'en'})`);
console.log('');

// ---- item 1
h('1. Pes -> metros (somente valores simples, alinhados)', 2);
{
  const cls = {};
  for (const m of R.measures) if (m.e.unit === 'ft') inc(cls, m.t.unit);
  console.log(
    'Unidade usada no pt para cada medida em pes: ' +
      sortEntries(cls)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') +
      '\n',
  );
  const ratios = {};
  for (const m of R.measures)
    if (m.e.unit === 'ft' && m.t.unit === 'm' && m.e.n2 === undefined && m.t.n2raw === undefined)
      inc(ratios, ratioStr(m.e, m.t));
  console.log(
    'Razao valor_pt / valor_en (pes->m, valores simples): ' +
      sortEntries(ratios)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') +
      '\n',
  );
  table(
    ['en (pes)', 'n', 'renderizacoes no pt (n)', 'mais de uma?', 'exemplos (chaves)'],
    valueTable(R, 'ft'),
  );
  console.log('Desvios do padrao 0,3 m (ou 30 cm para 1 pe), todas as ocorrencias:');
  for (const m of R.measures) {
    if (m.e.unit !== 'ft' || m.e.n2 !== undefined || m.t.n2raw !== undefined) continue;
    const r = m.t.n1 / m.e.n1;
    const std =
      (m.t.unit === 'm' && Math.abs(r - 0.3) < 1e-9) ||
      (m.t.unit === 'cm' && Math.abs(r - 30) < 1e-9) ||
      (m.t.unit === 'sq m' && Math.abs(r - 0.3) < 1e-9);
    if (!std)
      console.log(
        `  - ${m.key}: en "${m.e.raw}" -> pt "${m.t.raw}" (razao ${fmtNum(r)}; ${clip(snippet(m.enText, m.e.start, m.e.end, 30), 80)})`,
      );
  }
  console.log('');
  h('1b. Pes com intervalo ("5 to 10 feet", "10 by 10 feet")', 3);
  table(
    ['en', 'n', 'renderizacoes no pt (n)', 'mais de uma?', 'exemplos'],
    valueTable(R, 'ft', { onlySingle: false }),
  );
}

// ---- item 2
h('2. Milhas -> km (todos os casos)', 2);
{
  const rows = [];
  const ratios = {};
  for (const m of R.measures.filter((x) => x.e.unit === 'mi')) {
    inc(ratios, ratioStr(m.e, m.t) + ` (${m.t.unit})`);
    rows.push([
      m.key,
      clip(m.e.raw, 30),
      enValStr(m.e),
      `${tgtValStr(m.t)} ${m.t.form}`,
      ratioStr(m.e, m.t),
      clip(snippet(m.enText, m.e.start, m.e.end, 25), 70),
    ]);
  }
  console.log(
    'Razao valor_pt / valor_en: ' +
      sortEntries(ratios)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') +
      '\n',
  );
  table(
    ['en (milhas)', 'n', 'renderizacoes no pt (n)', 'mais de uma?', 'exemplos (chaves)'],
    valueTable(R, 'mi'),
  );
  console.log('Intervalos e formas sem numero:');
  table(
    ['en', 'n', 'renderizacoes no pt (n)', 'mais de uma?', 'exemplos'],
    valueTable(R, 'mi', { onlySingle: false }),
  );
  table(['chave', 'en', 'valor en', 'pt', 'razao', 'contexto en'], rows);
  h('2b. Milhas em strings nao alinhadas', 3);
  for (const u of R.unaligned) {
    const em = u.E.filter((e) => e.unit === 'mi');
    if (!em.length) continue;
    console.log(
      `- ${u.key}: en=[${u.E.map((e) => e.raw).join(' | ')}] pt=[${u.T.map((t) => t.raw).join(' | ')}]`,
    );
  }
  console.log('');
  h('2c. km no pt sem milha correspondente alinhada (todas as ocorrencias de km no pt)', 3);
  const kmAll = R.allTgt.filter((x) => x.t.unit === 'km');
  const kmVals = {};
  for (const x of kmAll) inc(kmVals, `${tgtValStr(x.t)} ${x.t.form}`);
  console.log(
    'Todas as ocorrencias de km no pt (valor unidade: n): ' +
      sortEntries(kmVals)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') +
      '\n',
  );
}

// ---- item 3
h('3. Outras unidades (alinhadas)', 2);
{
  const units = [...new Set(R.measures.map((m) => m.e.unit))]
    .filter((u) => u !== 'ft' && u !== 'mi')
    .sort();
  for (const u of units) {
    h(`3.${u}`, 3);
    const cls = {};
    for (const m of R.measures) if (m.e.unit === u) inc(cls, m.t.unit);
    console.log(
      'Unidade no pt: ' +
        sortEntries(cls)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ') +
        '\n',
    );
    const rowsS = valueTable(R, u, { listKeys: 3 });
    if (rowsS.length)
      table(['en', 'n', 'renderizacoes no pt (n)', 'mais de uma?', 'exemplos'], rowsS);
    const rowsR = valueTable(R, u, { onlySingle: false });
    if (rowsR.length) {
      console.log('Intervalos:');
      table(['en', 'n', 'renderizacoes no pt (n)', 'mais de uma?', 'exemplos'], rowsR);
    }
  }
  const implied = R.measures.filter((m) => m.e.implied);
  h('3.implied Formas sem numero ("every foot", "per foot", "an extra foot", "half-mile")', 3);
  table(
    ['chave', 'en', 'pt'],
    implied.map((m) => [m.key, clip(snippet(m.enText, m.e.start, m.e.end, 20), 60), `${m.t.raw}`]),
  );
}

// ---- item 4 and 5
h('4. Formato decimal no pt (todas as medidas metricas extraidas, alinhadas ou nao)', 2);
{
  const fm = {};
  for (const x of R.allTgt) inc(fm, `${x.t.fmt}|${x.t.unit}`);
  const fmtTot = {};
  for (const x of R.allTgt) inc(fmtTot, x.t.fmt);
  console.log(
    'Total por formato: ' +
      sortEntries(fmtTot)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') +
      '\n',
  );
  const ex = {};
  for (const x of R.allTgt)
    if (
      (x.t.fmt === 'decimal-dot' || x.t.fmt === 'thousands-dot' || x.t.fmt === 'other') &&
      !ex[x.t.fmt + x.t.n1raw]
    )
      ex[x.t.fmt + x.t.n1raw] = `${x.key}: "${x.t.raw}"`;
  console.log(
    'Exemplos de ponto/outros:\n' +
      Object.values(ex)
        .slice(0, 12)
        .map((s) => '  - ' + s)
        .join('\n') +
      '\n',
  );
  const decVals = {};
  for (const x of R.allTgt)
    if (x.t.fmt === 'decimal-comma') inc(decVals, `${x.t.n1raw} ${x.t.unit}`);
  console.log(
    'Valores com virgula (valor unidade: n): ' +
      sortEntries(decVals)
        .map(([k, v]) => `${k}: ${v}`)
        .join(', ') +
      '\n',
  );
  // dot decimals in plain text (outside measures), e.g. "1.5"
}

h('5. Singular/plural e escrita da unidade (pt)', 2);
{
  const cat = (t) => {
    const v = t.n1;
    if (t.n2 !== undefined) return 'intervalo (n a m)';
    if (v === 1) return 'exatamente 1';
    if (v > 0 && v < 1) return 'entre 0 e 1';
    if (v > 1 && v < 2) return 'decimal entre 1 e 2 (ex. 1,5)';
    if (!Number.isInteger(v)) return 'decimal >= 2 (ex. 4,5)';
    return 'inteiro > 1';
  };
  const isPlural = (f) => /(s|ões)$/.test(f) && !/^(m|km|kg|cm|g|l|lb|ft|mph)$/.test(f);
  for (const baseU of ['m', 'km', 'kg', 'cm', 'ml', 'l', 'g']) {
    const sel = R.allTgt.filter((x) => x.t.base === baseU && !x.t.unit.includes(' '));
    if (!sel.length) continue;
    h(`5.${baseU}`, 3);
    const grid = {};
    for (const x of sel) {
      const form = x.t.spelled ? (isPlural(x.t.form) ? 'plural' : 'singular') : 'abreviado';
      inc((grid[cat(x.t)] ||= {}), form);
    }
    table(
      ['valor', 'singular', 'plural', 'abreviado'],
      Object.entries(grid).map(([k, o]) => [k, o.singular || 0, o.plural || 0, o.abreviado || 0]),
    );
    const abbr = sel.filter((x) => !x.t.spelled);
    const sp = {};
    for (const x of abbr) inc(sp, x.t.sep);
    console.log(
      `Abreviado: ${abbr.length}; separador numero-unidade: ${
        sortEntries(sp)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ') || 'n/a'
      }`,
    );
    for (const x of abbr.slice(0, 6))
      console.log(`  - ${x.key}: "${snippet(x.text, x.t.start, x.t.end, 25)}"`);
    // exceptions
    const odd = sel.filter(
      (x) =>
        x.t.spelled &&
        x.t.n2 === undefined &&
        ((x.t.n1 === 1 && isPlural(x.t.form)) ||
          (Number.isInteger(x.t.n1) && x.t.n1 > 1 && !isPlural(x.t.form))),
    );
    console.log(
      `Concordancia fora do padrao (exatamente 1 no plural, ou inteiro >= 2 no singular): ${odd.length}`,
    );
    const pl = sel.filter(
      (x) => x.t.spelled && x.t.n2 === undefined && x.t.n1 > 1 && x.t.n1 < 2 && isPlural(x.t.form),
    );
    console.log(`Decimal entre 1 e 2 no plural (lista): ${pl.length}`);
    for (const x of pl) console.log(`  - ${x.key}: "${snippet(x.text, x.t.start, x.t.end, 25)}"`);
    for (const x of odd.slice(0, 6))
      console.log(`  - ${x.key}: "${snippet(x.text, x.t.start, x.t.end, 25)}"`);
    console.log('');
  }
  {
    const sp = {};
    for (const x of R.allTgt)
      if (!IMPERIAL.has(x.t.base))
        inc(sp, `${x.t.base}:${x.t.spelled ? 'por extenso' : 'abreviado'}`);
    console.log(
      'Resumo por unidade metrica (por extenso x abreviado, todas as medidas pt): ' +
        sortEntries(sp)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ') +
        '\n',
    );
    // dot decimals anywhere in the pt text outside brackets and tags (e.g. "1.5")
    let dots = 0;
    const dotEx = [];
    for (const p of pairs51pt) {
      const t = stripBrackets(stripTags(p.tgt));
      for (const m of t.matchAll(/(?<![\d.,])\d+\.\d+(?![\d.])/g)) {
        dots++;
        if (dotEx.length < 6)
          dotEx.push(`${p.key}: "${snippet(t, m.index, m.index + m[0].length, 18)}"`);
      }
    }
    console.log(
      `Numeros com ponto decimal (d.d) em qualquer lugar do pt, fora de colchetes e tags: ${dots}`,
    );
    dotEx.forEach((x) => console.log('  - ' + x));
    console.log('');
  }
  // unit without a number ("cada metro", "por metro")
  const bare = {};
  const bareEx = [];
  for (const p of pairs51pt) {
    const t = stripBrackets(stripTags(p.tgt));
    for (const m of t.matchAll(
      /(?<![\p{L}])(metros?|quil[oô]metros?|quilos?|p[ée]s?)(?![\p{L}])/giu,
    )) {
      const before = t.slice(0, m.index).trimEnd();
      if (/[\d²³]$/.test(before)) continue;
      inc(bare, m[1].toLowerCase());
      if (bareEx.length < 14)
        bareEx.push(`${p.key}: "${snippet(t, m.index, m.index + m[0].length, 22)}"`);
    }
  }
  console.log(
    'Unidade metrica/pes sem numero antes: ' +
      sortEntries(bare)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
  );
  bareEx.forEach((s) => console.log('  - ' + s));
  console.log('');
}

// ---- item 6
h('6. Formas compostas: ordem das palavras e preposicao no pt', 2);
{
  const SUF_HY = new Set([
    'radius',
    'wide',
    'long',
    'high',
    'tall',
    'deep',
    'diameter',
    'thick',
    'square',
    'by',
    'cube',
    'cone',
    'line',
    'sphere',
    'cylinder',
    'area',
  ]);
  const POST = new Set([
    'tall',
    'long',
    'wide',
    'high',
    'thick',
    'deep',
    'square',
    'away',
    'apart',
    'per',
    'radius',
    'cube',
    'diameter',
  ]);
  const PRE = new Set([
    'within',
    'to',
    'of',
    'than',
    'by',
    'additional',
    'every',
    'extra',
    'as',
    'least',
    'or',
    'and',
    'in',
    'per',
  ]);
  function shapeOf(e, text) {
    if (e.implied) return `implicito: ${e.raw.toLowerCase()}`;
    const after = text.slice(e.end);
    const beforeWords = text
      .slice(0, e.start)
      .split(/[\s(]+/)
      .filter(Boolean);
    const pre = (beforeWords[beforeWords.length - 1] || '').toLowerCase().replace(/[^a-z]/g, '');
    const preK = PRE.has(pre) ? pre + ' ' : '';
    const u = e.base;
    const mod = e.unit.includes(' ') ? e.unit.split(' ')[0] + ' ' : '';
    if (e.n2 !== undefined)
      return `${e.join === 'by' || e.join === '-by-' || e.join === 'x' ? 'N by N' : e.join === 'or' ? 'N or N' : 'N to N'} ${mod}${u}`;
    if (e.hyphenated) {
      let m = after.match(/^-(\w+)/);
      if (m) return `N-${u}-${SUF_HY.has(m[1].toLowerCase()) ? m[1].toLowerCase() : '<outro>'}`;
      m = after.match(/^\s+(\w+)/);
      if (m)
        return `N-${u} ${SUF_HY.has(m[1].toLowerCase()) ? m[1].toLowerCase() : '<substantivo>'}`;
      return `N-${u}`;
    }
    const m = after.match(/^\s+(\w+)/);
    const post = m && POST.has(m[1].toLowerCase()) ? ' ' + m[1].toLowerCase() : '';
    return `${preK}N ${mod}${u}${post}`;
  }
  function ctx(text, t) {
    const left = text.slice(0, t.start).split(/\s+/).filter(Boolean).slice(-2).join(' ');
    const right = text.slice(t.end).split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
    return `${left} N{${t.unit}} ${right}`.replace(/\s+/g, ' ').replace(/[\d]+(?:[.,]\d+)*/g, 'N');
  }
  const groups = new Map();
  for (const m of R.measures) {
    const s = shapeOf(m.e, m.enText);
    if (!groups.has(s)) groups.set(s, { n: 0, pt: new Map(), left: new Map(), ex: [] });
    const g = groups.get(s);
    g.n++;
    const lw = m.tgtText
      .slice(0, m.t.start)
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .join(' ')
      .toLowerCase()
      .replace(/[\d]+(?:[.,]\d+)*/g, 'N');
    g.left.set(lw, (g.left.get(lw) || 0) + 1);
    const c = ctx(m.tgtText, m.t, 'pt');
    if (!g.pt.has(c)) g.pt.set(c, { n: 0, key: m.key });
    g.pt.get(c).n++;
    if (g.ex.length < 2)
      g.ex.push({
        key: m.key,
        en: snippet(m.enText, m.e.start, m.e.end, 30),
        pt: snippet(m.tgtText, m.t.start, m.t.end, 30),
      });
  }
  const sorted = [...groups.entries()].sort((a, b) => b[1].n - a[1].n);
  console.log(
    `(${sorted.length} formas; so strings alinhadas; contexto pt = 2 palavras antes, 3 depois, numeros mascarados como N, unidade como N{classe})\n`,
  );
  for (const [s, g] of sorted) {
    console.log(`#### ${s} — ${g.n}x`);
    const top = [...g.pt.entries()].sort((a, b) => b[1].n - a[1].n).slice(0, 4);
    console.log('  pt: ' + top.map(([c, x]) => `"${c}" (${x.n})`).join('; '));
    console.log(
      '  pt, 2 palavras antes da medida: ' +
        [...g.left.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([c, n]) => `"${c}" (${n})`)
          .join('; '),
    );
    g.ex.forEach((e) => console.log(`  ex: ${e.key}\n      en: …${e.en}…\n      pt: …${e.pt}…`));
  }
}

// ---- item 6b: where the noun that names the dimension sits relative to the number (pt)
h('6b. Posicao da palavra da dimensao em relacao ao numero (pt)', 2);
{
  const DIM = [
    ['radius', /radius/i, /raio/i],
    ['diameter', /diameter/i, /di[âa]metro/i],
    ['cube', /\bcube\b|-cube/i, /cubo/i],
    ['cone', /\bcone\b/i, /cone/i],
    ['sphere', /\bsphere\b/i, /esfera/i],
    ['cylinder', /cylinder/i, /cilindro/i],
    ['long', /\blong\b|-long/i, /comprimento/i],
    ['high/tall', /\bhigh\b|\btall\b|-high|-tall/i, /altura/i],
    ['wide', /\bwide\b|-wide/i, /largura/i],
    ['thick', /\bthick\b/i, /espessura|altura/i],
    ['deep', /\bdeep\b|-deep/i, /profundidade/i],
    ['square', /\bsquare\b|-square/i, /quadrad|lado/i],
    ['away', /\baway\b/i, /dist[âa]ncia|longe/i],
  ];
  const rows = [];
  for (const [name, reEn, rePtW] of DIM) {
    let before = 0,
      after = 0,
      both = 0,
      none = 0,
      n = 0;
    for (const m of R.measures) {
      const enCtx = m.enText.slice(Math.max(0, m.e.start - 14), m.e.end + 14);
      if (!reEn.test(enCtx)) continue;
      // keep only forms where the en keyword is adjacent to the measurement
      n++;
      const left = m.tgtText.slice(0, m.t.start).split(/\s+/).filter(Boolean).slice(-3).join(' ');
      const right = m.tgtText.slice(m.t.end).split(/\s+/).filter(Boolean).slice(0, 3).join(' ');
      const l = rePtW.test(left),
        r = rePtW.test(right);
      if (l && r) both++;
      else if (l) before++;
      else if (r) after++;
      else none++;
    }
    rows.push([name, n, before, after, both, none]);
  }
  console.log(
    'Janela: 3 palavras antes e 3 depois da medida no pt; a palavra en e procurada +-14 caracteres da medida em en (aproximado: uma medida vizinha pode contar).\n',
  );
  table(
    [
      'dimensao (en)',
      'medidas',
      'palavra pt ANTES do numero ("raio de 6 m")',
      'palavra pt DEPOIS ("6 m de raio")',
      'dos dois lados',
      'nenhum dos dois',
    ],
    rows,
  );
}

// ---- item 7
h('7. Nao convertido (unidade imperial mantida ou numero igual)', 2);
{
  const kept = R.measures.filter((m) => IMPERIAL.has(m.t.base));
  const sameNum = R.measures.filter(
    (m) =>
      !IMPERIAL.has(m.t.base) &&
      m.e.n2 === undefined &&
      m.t.n2raw === undefined &&
      m.e.n1 === m.t.n1 &&
      !m.e.implied &&
      m.e.unit !== m.t.unit,
  );
  const k = {};
  for (const m of kept) inc(k, `${m.e.unit} -> ${m.t.form}`);
  console.log(
    `Unidade imperial mantida no pt (alinhadas): ${kept.length}. Por par: ${sortEntries(k)
      .map(([a, b]) => `${a}: ${b}`)
      .join(', ')}\n`,
  );
  for (const m of kept.slice(0, 40))
    console.log(
      `  - ${m.key}: en "${m.e.raw}" / pt "${m.t.raw}" … ${clip(snippet(m.tgtText, m.t.start, m.t.end, 25), 70)}`,
    );
  console.log(
    `\nMesmo numero com unidade diferente (ex. 30 feet -> 30 metros), alinhadas: ${sameNum.length}\n`,
  );
  for (const m of sameNum.slice(0, 40))
    console.log(`  - ${m.key}: en "${m.e.raw}" / pt "${m.t.raw}"`);
  // implied pairs and unaligned with kept imperial
  const keptAll = R.allTgt.filter((x) => IMPERIAL.has(x.t.base));
  const ka = {};
  for (const x of keptAll) inc(ka, x.t.form);
  console.log(
    `\nUnidade imperial no pt em qualquer string (alinhada ou nao): ${keptAll.length}. Formas: ${sortEntries(
      ka,
    )
      .map(([a, b]) => `${a}=${b}`)
      .join(', ')}\n`,
  );
  for (const x of keptAll)
    console.log(`  - ${x.key}: "${snippet(x.text, x.t.start, x.t.end, 28)}"`);

  h('7b. Strings nao alinhadas (en e pt com numero diferente de medidas)', 3);
  const zeroPt = R.unaligned.filter((u) => u.E.length && !u.T.length);
  const zeroEn = R.unaligned.filter((u) => !u.E.length && u.T.length);
  const diff = R.unaligned.filter((u) => u.E.length && u.T.length);
  console.log(
    `Total ${R.unaligned.length}: so en tem medida ${zeroPt.length}; so pt tem medida ${zeroEn.length}; ambos, contagens diferentes ${diff.length}\n`,
  );
  for (const [name, arr] of [
    ['so en', zeroPt],
    ['so pt', zeroEn],
    ['contagens diferentes', diff],
  ]) {
    console.log(`${name} (ate 25):`);
    for (const u of arr.slice(0, 25))
      console.log(
        `  - ${u.key}: en=[${u.E.map((e) => e.raw).join(' | ')}] pt=[${u.T.map((t) => t.raw).join(' | ')}]`,
      );
  }
  console.log('');
}

// ---- item 8
h('8. Numeros que nunca mudam e parecidos perigosos', 2);
{
  const PROTECT = [
    ['nivel (5th level)', /\b\d+(?:st|nd|rd|th)[- ]level\b/gi],
    ['dados (2d6)', /\b\d*d\d+\b/gi],
    ['CD (DC 15)', /\bDC \d+\b/g],
    [
      'duracao (N minutes etc.)',
      /\b\d+ (?:minutes?|hours?|rounds?|days?|turns?|seconds?|weeks?|months?|years?)\b/gi,
    ],
    ['custo (N gp)', /\b\d[\d,]* (?:gp|sp|cp|ep|pp)\b/gi],
  ];
  const rows = [];
  for (const [name, re] of PROTECT) {
    let strings = 0,
      spans = 0,
      overlaps = 0;
    for (const p of pairs51pt) {
      const t = stripTags(p.en);
      const E = extractEn(t);
      const ms = [...t.matchAll(re)];
      if (ms.length) strings++;
      spans += ms.length;
      for (const m of ms)
        for (const e of E) if (e.start < m.index + m[0].length && e.end > m.index) overlaps++;
    }
    rows.push([name, strings, spans, overlaps]);
  }
  table(
    ['categoria protegida (en)', 'strings', 'ocorrencias', 'sobreposicao com medida extraida'],
    rows,
  );
  // pt side: levels, DC, etc.
  const PT_PROT = [
    [
      'circulo/nivel (3o circulo, 5o nivel)',
      /\b\d+\s*[ºo°]\s*(?:c[ií]rculo|n[ií]vel)\b|\bn[ií]vel \d+\b/gi,
    ],
    ['CD', /\bCD \d+\b/g],
    ['dados', /\b\d*d\d+\b/gi],
    [
      'duracao',
      /\b\d+ (?:minutos?|horas?|rodadas?|dias?|turnos?|segundos?|semanas?|meses|anos?)\b/gi,
    ],
  ];
  const rows2 = [];
  for (const [name, re] of PT_PROT) {
    let strings = 0,
      spans = 0,
      overlaps = 0;
    for (const p of pairs51pt) {
      const t = stripBrackets(stripTags(p.tgt));
      const T = extractTgt(t, 'pt');
      const ms = [...t.matchAll(re)];
      if (ms.length) strings++;
      spans += ms.length;
      for (const m of ms)
        for (const x of T) if (x.start < m.index + m[0].length && x.end > m.index) overlaps++;
    }
    rows2.push([name, strings, spans, overlaps]);
  }
  table(
    ['categoria protegida (pt)', 'strings', 'ocorrencias', 'sobreposicao com medida extraida'],
    rows2,
  );

  // look-alikes: unit words in en that the extractor did NOT capture
  const lookalike = {};
  const laEx = {};
  for (const p of pairs51pt) {
    const t = stripTags(p.en);
    const E = extractEn(t);
    for (const m of t.matchAll(
      /\b(feet|foot|miles?|pounds?|pound|inch(?:es)?|gallons?|ounces?|yards?|pints?)\b/gi,
    )) {
      if (E.some((e) => m.index >= e.start && m.index < e.end)) continue;
      const k = m[1].toLowerCase();
      const w = t.slice(Math.max(0, m.index - 12), m.index + m[0].length + 12).replace(/\s+/g, ' ');
      inc(lookalike, k);
      (laEx[k] ||= []).push(`${p.key}: "${w}"`);
    }
  }
  console.log(
    'Palavras de unidade em en NAO capturadas pelo extrator (parecidos): ' +
      sortEntries(lookalike)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') +
      '\n',
  );
  for (const [k, arr] of Object.entries(laEx)) {
    console.log(`  ${k}:`);
    arr.slice(0, 12).forEach((s) => console.log('    - ' + s));
  }
  console.log('');
  // names and terms
  const nameRows = [];
  for (const m of R.measures.filter((x) => /\/name$/.test(x.key)))
    nameRows.push([m.key, clip(m.enText, 50), clip(m.tgtText, 50)]);
  console.log('Campo "name" com medida (alinhado):');
  table(['chave', 'en', 'pt'], nameRows);
  const nameU = R.unaligned.filter((u) => /\/name$/.test(u.key));
  console.log(`Campo "name" com medida e nao alinhado: ${nameU.length}`);
  nameU.slice(0, 10).forEach((u) => console.log(`  - ${u.key}: "${u.enText}" / "${u.tgtText}"`));
  // word numbers + unit (not extracted)
  const wn = [];
  for (const p of pairs51pt) {
    const t = stripTags(p.en);
    for (const m of t.matchAll(
      /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|twenty|thirty|forty|fifty|sixty|hundred|thousand|half|quarter)(?:[- ](?:foot|feet|mile|miles|pound|pounds|inch|inches))\b/gi,
    ))
      wn.push(`${p.key}: "${snippet(t, m.index, m.index + m[0].length, 20)}"`);
  }
  console.log(
    `\nNumero por extenso + unidade em en (nao extraido como medida numerica): ${wn.length}`,
  );
  wn.slice(0, 15).forEach((s) => console.log('  - ' + s));
  // "foot"/"feet" body part etc. in pt: pes/pe not preceded by number
  const ptFoot = [];
  for (const p of pairs51pt) {
    const t = stripBrackets(stripTags(p.tgt));
    for (const m of t.matchAll(/\b(p[ée]s?)\b/giu)) {
      if (/\d\s*$/.test(t.slice(Math.max(0, m.index - 3), m.index))) continue;
      ptFoot.push(`${p.key}: "${snippet(t, m.index, m.index + m[0].length, 18)}"`);
    }
  }
  console.log(`\n"pe/pes" no pt sem numero antes (parte do corpo, "pe de ..."): ${ptFoot.length}`);
  ptFoot.slice(0, 8).forEach((s) => console.log('  - ' + s));
}

// ---- messages and code facts
h('9a. messages/en.json x messages/pt.json (textos da interface)', 2);
{
  const mEn = flatten(JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/en.json'), 'utf8')));
  const mPt = flatten(JSON.parse(fs.readFileSync(path.join(ROOT, 'messages/pt.json'), 'utf8')));
  const rows = [];
  for (const [k, v] of Object.entries(mEn)) {
    if (
      /\b(ft\.?|feet|foot|mile|miles|lb|lbs|pounds?|inch|gallon|km|kg|meters?)\b|\{(feet|meters|miles|km|weight)\}/i.test(
        v,
      ) ||
      /\b(ft\.?|km|kg|metros?|milhas?|quilos?|libras?|\{meters\}|\{km\}|\{feet\})/i.test(
        mPt[k] || '',
      )
    )
      rows.push([k, clip(v, 60), clip(mPt[k] || '(sem)', 60)]);
  }
  table(['chave', 'en', 'pt'], rows);
  for (const l of ['es', 'sv']) {
    try {
      const mO = flatten(
        JSON.parse(fs.readFileSync(path.join(ROOT, `messages/${l}.json`), 'utf8')),
      );
      console.log(
        `messages/${l}.json: ${Object.keys(mO).length} chaves; chaves de unidade presentes: ${rows.filter(([k]) => mO[k]).length} de ${rows.length}\n`,
      );
    } catch (e) {
      console.log(`messages/${l}.json: nao lido (${e.message})\n`);
    }
  }
}

// ---- item 9
h('9. srd-5.2 (pt) e es (5.1 e 5.2): mesma convencao?', 2);
{
  const sets = [
    ['pt 5.1 (referencia)', 'srd-5.1', 'pt'],
    ['pt 5.2', 'srd-5.2', 'pt'],
    ['es 5.1', 'srd-5.1', 'es'],
    ['es 5.2', 'srd-5.2', 'es'],
    ['sv 5.1', 'srd-5.1', 'sv'],
    ['sv 5.2', 'srd-5.2', 'sv'],
  ];
  const sum = [];
  const detail = [];
  for (const [label, ed, lang] of sets) {
    const en = loadLang(ed, 'en');
    const tg = loadLang(ed, lang);
    const { pairs, stats } = pairsOf(en, tg);
    const A = analyse(pairs, lang);
    const fl = {};
    for (const p of pairs)
      inc(
        fl,
        p.key
          .split('/')
          .pop()
          .replace(/\[\d+\]/, ''),
      );
    sum.push([
      label,
      stats.keys,
      stats.translated,
      sortEntries(fl)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
      A.enMeasuresTotal,
      A.enMeasuresAligned,
      A.unaligned.length,
      A.bracketStrings,
      `${A.tagStats.enTags}/${A.tagStats.enMeasureInTag.length}/${A.tagStats.tgtMeasureInTag.length}`,
    ]);
    detail.push([label, A]);
  }
  table(
    [
      'conjunto',
      'chaves en',
      'pares traduzidos',
      'campos traduzidos',
      'medidas en',
      'medidas alinhadas',
      'strings nao alinhadas',
      'strings com colchete',
      'tags en / com medida en / com medida no alvo',
    ],
    sum,
  );
  for (const [label, A] of detail) {
    if (!A.measures.length) {
      console.log(`### ${label}: nenhuma medida alinhada.\n`);
      continue;
    }
    h(label, 3);
    for (const [eu, name] of [
      ['ft', 'pes'],
      ['mi', 'milhas'],
      ['lb', 'libras'],
      ['in', 'polegadas'],
      ['gal', 'galoes'],
      ['oz', 'onças'],
      ['pt', 'pintas'],
      ['cu ft', 'pes cubicos'],
      ['sq ft', 'pes quadrados'],
      ['yd', 'jardas'],
      ['sq yd', 'jardas quadradas'],
    ]) {
      const ms = A.measures.filter((m) => m.e.unit === eu);
      if (!ms.length) continue;
      const tu = {};
      const ratios = {};
      for (const m of ms) {
        inc(tu, m.t.unit);
        if (m.e.n2 === undefined && m.t.n2raw === undefined && !m.e.implied)
          inc(ratios, `${ratioStr(m.e, m.t)} (${m.t.unit})`);
      }
      console.log(
        `- ${name} (en ${eu}, ${ms.length}): unidade no alvo ${sortEntries(tu)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ')}; razao valor_alvo/valor_en ${sortEntries(ratios)
          .map(([k, v]) => `${k}: ${v}`)
          .join(', ')}`,
      );
    }
    const fm = {};
    for (const x of A.allTgt) inc(fm, x.t.fmt);
    console.log(
      `- formato numerico no alvo: ${sortEntries(fm)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`,
    );
    const mm = A.allTgt.filter((x) => x.t.base === 'm' && !x.t.unit.includes(' '));
    const sp = {};
    for (const x of mm)
      inc(
        sp,
        x.t.spelled
          ? /s$/.test(x.t.form)
            ? 'metros (plural)'
            : 'metro (singular)'
          : 'm (abreviado)',
      );
    console.log(
      `- "metro": ${sortEntries(sp)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ')}`,
    );
    {
      const sp2 = {};
      for (const x of A.allTgt)
        if (!IMPERIAL.has(x.t.base))
          inc(sp2, `${x.t.base}:${x.t.spelled ? 'por extenso' : 'abreviado'}`);
      console.log(
        `- unidades metricas (por extenso x abreviado): ${
          sortEntries(sp2)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ') || '(nenhuma)'
        }`,
      );
      const imp = {};
      for (const x of A.allTgt)
        if (IMPERIAL.has(x.t.base))
          inc(imp, `${x.t.base}:${x.t.spelled ? 'por extenso' : 'abreviado'}`);
      console.log(
        `- unidades imperiais no alvo (por extenso x abreviado): ${
          sortEntries(imp)
            .map(([k, v]) => `${k}=${v}`)
            .join(', ') || '(nenhuma)'
        }`,
      );
    }
    const one = mm.filter((x) => x.t.n1 === 1 && x.t.n2 === undefined);
    const o = {};
    for (const x of one) inc(o, x.t.form);
    console.log(
      `- valor exato 1 em metros: ${
        sortEntries(o)
          .map(([k, v]) => `${k}=${v}`)
          .join(', ') || '(nenhum)'
      }`,
    );
    const ex = A.measures.filter((m) => m.e.unit === 'ft').slice(0, 3);
    for (const m of ex) console.log(`    ex: ${m.key}: en "${m.e.raw}" -> "${m.t.raw}"`);
    const dev = A.measures.filter(
      (m) =>
        m.e.unit === 'ft' &&
        m.e.n2 === undefined &&
        m.t.n2raw === undefined &&
        !m.e.implied &&
        !(m.t.base === 'm' && Math.abs(m.t.n1 / m.e.n1 - 0.3) < 1e-9) &&
        !(m.t.base === 'cm' && m.t.n1 / m.e.n1 === 30) &&
        !(IMPERIAL.has(m.t.base) && m.t.n1 === m.e.n1),
    );
    console.log(`- pes: desvios do padrao do conjunto (${dev.length}):`);
    for (const m of dev.slice(0, 12))
      console.log(`    · ${m.key}: en "${m.e.raw}" -> "${m.t.raw}"`);
    {
      const ftm = A.measures.filter((m) => m.e.unit === 'ft');
      const cnt = {};
      for (const m of ftm) inc(cnt, m.t.unit);
      const dom = sortEntries(cnt)[0]?.[0];
      const other = ftm.filter((m) => m.t.unit !== dom);
      console.log(`- pes: unidade dominante no alvo "${dom}"; outras unidades (${other.length}):`);
      for (const m of other.slice(0, 8))
        console.log(`    · ${m.key}: en "${m.e.raw}" -> "${m.t.raw}"`);
    }
    for (const eu of ['mi', 'lb', 'in']) {
      const d2 = A.measures.filter(
        (m) => m.e.unit === eu && m.e.n2 === undefined && m.t.n2raw === undefined,
      );
      const r = {};
      for (const m of d2) (r[ratioStr(m.e, m.t)] ||= []).push(m.key);
      const dom = Object.entries(r).sort((a, b) => b[1].length - a[1].length)[0];
      for (const [k, arr] of Object.entries(r))
        if (dom && k !== dom[0])
          console.log(
            `    · ${eu}: razao ${k} fora do dominante ${dom[0]}: ${arr.slice(0, 3).join(', ')}`,
          );
    }
    // imperial kept
    const keptAll = A.allTgt.filter((x) => IMPERIAL.has(x.t.base));
    console.log(`- unidade imperial presente no alvo (qualquer string): ${keptAll.length}`);
    // fully converted check for 5.2 pt
  }
}

h('10. Todas as strings 5.1 pt: "ft" dentro de colchete vs fora (sanidade)', 2);
{
  let inBr = 0,
    outBr = 0;
  for (const p of pairs51pt) {
    const noBr = stripBrackets(stripTags(p.tgt));
    outBr += [...noBr.matchAll(/\bft\b/g)].length;
    for (const b of p.tgt.matchAll(BRACKET_RE)) inBr += [...b[0].matchAll(/\bft\b/g)].length;
  }
  console.log(`"ft" dentro de colchetes: ${inBr}; "ft" fora de colchetes: ${outBr}\n`);
}

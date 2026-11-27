// PoC 2, stage A2: same test set as poc2-bench.mjs, testing fixes for the failures found there.
//   --variant v2  prompt rule against extra markers + retry with error feedback + deterministic marker repair
//   --variant v3  v2 + dice, DCs and converted measurements protected as opaque markers before the model
// ICU messages are compared by structure (small parser below), not by regular expression.
// Original header follows.
// PoC 2, stage A: automatic quality checks for local translation engines (English → pt-BR).
// No human rating here and no model grading itself: only deterministic checks plus chrF against
// the approved Portuguese already in the repository.
//
//   node docs/discovery/localization-infrastructure/scripts/poc2-bench.mjs \
//     --engine qwen3.5-9b --parallel 4 --out ~/l10n-poc/work/poc2-qwen.json
//
// Test set (fixed seed): 100 SRD 5.1 spell descriptions and 50 UI strings that have approved pt.
// Pipeline under test: convert units → mask {@tags} → translate with glossary and examples →
// validate → retry (up to 2) → unmask.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(
  process.argv
    .slice(2)
    .reduce(
      (acc, a, i, all) => (a.startsWith('--') ? [...acc, [a.slice(2), all[i + 1]]] : acc),
      [],
    ),
);
const URL_BASE = args.url ?? 'http://127.0.0.1:8080';
const PARALLEL = Number(args.parallel ?? 4);
const ENGINE = args.engine ?? 'unknown';
const OUT = (args.out ?? `poc2-${ENGINE}.json`).replace(/^~/, process.env.HOME);
const LIMIT = Number(args.limit ?? 0);
const VARIANT = args.variant ?? 'v2';
const ROOT = path.resolve(import.meta.dirname, '../../../..');
const json = (file) => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'));

// ---------- sample ----------
const prng = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const shuffle = (list, random) => {
  const pool = [...list];
  const out = [];
  while (pool.length) out.push(pool.splice(Math.floor(random() * pool.length), 1)[0]);
  return out;
};
const flatten = (obj, prefix = '', out = {}) => {
  for (const [key, value] of Object.entries(obj)) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[full] = value;
    else if (value && typeof value === 'object') flatten(value, full, out);
  }
  return out;
};

// The approved pt of SRD 5.1 carries English leftovers in brackets ("6 metros [20-foot-radius sphere]").
const cleanReference = (text) =>
  text.replace(
    /\s*\[[^\]]*(ft|foot|feet|miles?|pounds?|inch|inches|gallons?|cube|radius|sphere|cone|line)[^\]]*\]/gi,
    '',
  );

const random = prng(20261127);
const spellsEn = json('content/dnd5e/srd-5.1/i18n/en/spells.json');
const spellsPt = json('content/dnd5e/srd-5.1/i18n/pt/spells.json');
const spellPairs = shuffle(
  Object.keys(spellsEn).filter(
    (k) => spellsEn[k].description?.trim() && spellsPt[k]?.description?.trim(),
  ),
  random,
).map((k) => ({
  key: `srd-5.1/spells/${k}.description`,
  group: 'rules',
  source: spellsEn[k].description,
  reference: cleanReference(spellsPt[k].description),
}));
// The first three (short ones) are prompt examples and never part of the test set.
const examples = spellPairs.filter((p) => p.source.length < 450).slice(0, 3);
const rules = spellPairs.filter((p) => !examples.includes(p)).slice(0, 100);

const uiEn = flatten(json('messages/en.json'));
const uiPt = flatten(json('messages/pt.json'));
const uiPairs = shuffle(
  Object.keys(uiEn).filter((k) => uiEn[k].trim() && uiPt[k]?.trim()),
  random,
).map((k) => ({ key: `ui/${k}`, group: 'ui', source: uiEn[k], reference: uiPt[k] }));
const icu = uiPairs
  .filter((p) => /\{[^}]*,\s*(plural|select)/.test(p.source) || /<\w+>/.test(p.source))
  .slice(0, 15);
const ui = [...icu, ...uiPairs.filter((p) => !icu.includes(p)).slice(0, 35)];

let sample = [...rules, ...ui];
if (LIMIT) sample = [...rules.slice(0, LIMIT), ...ui.slice(0, LIMIT)];

// ---------- unit conversion (provisional convention, taken from the approved pt of SRD 5.1) ----------
const fmt = (n) => String(Math.round(n * 10) / 10);
const km = (miles) => (miles === 1 ? 1.5 : Math.round(miles * 1.6));
const UNITS = [
  [
    /(\d+(?:,\d{3})*(?:\.\d+)?)[- ](?:foot|feet|ft\.?)(?=[- ]|\b)/gi,
    (n) => `${fmt(n * 0.3)}-meter`,
    (n) => `${fmt(n * 0.3)} meters`,
  ],
  [
    /(\d+(?:,\d{3})*(?:\.\d+)?)[- ]miles?\b/gi,
    (n) => `${km(n)}-kilometer`,
    (n) => `${km(n)} kilometers`,
  ],
  [
    /(\d+(?:,\d{3})*(?:\.\d+)?)[- ](?:pounds?|lb\.?)(?=[- ]|\b)/gi,
    (n) => `${fmt(Math.round(n * 0.45 * 2) / 2)}-kilogram`,
    (n) => `${fmt(Math.round(n * 0.45 * 2) / 2)} kilograms`,
  ],
  [
    /(\d+(?:,\d{3})*(?:\.\d+)?)[- ]inch(?:es)?\b/gi,
    (n) => `${fmt(n * 2.5)}-centimeter`,
    (n) => `${fmt(n * 2.5)} centimeters`,
  ],
  [
    /(\d+(?:,\d{3})*(?:\.\d+)?)[- ]gallons?\b/gi,
    (n) => `${fmt(n * 4)}-liter`,
    (n) => `${fmt(n * 4)} liters`,
  ],
];
const convertUnits = (text) =>
  UNITS.reduce(
    (current, [pattern, hyphenated, spaced]) =>
      current.replace(pattern, (match, digits) => {
        const n = Number(digits.replace(/,/g, ''));
        return /^\S+-/.test(match) ? hyphenated(n) : spaced(n);
      }),
    text,
  );

// ---------- tag masking ----------
const OPAQUE = new Set([
  'damage',
  'scaledamage',
  'dice',
  'scaledice',
  'dc',
  'chance',
  'hit',
  'recharge',
  'filter',
  'book',
]);
function mask(text) {
  const tags = [];
  const masked = text.replace(/\{@(\w+) ([^}]*)\}/g, (whole, type, body) => {
    const index = tags.length;
    const segments = body.split('|');
    if (OPAQUE.has(type)) {
      tags.push({ whole, opaque: true });
      return `<t${index}/>`;
    }
    const display = segments[2] ?? segments[0];
    tags.push({ type, segments, display });
    return `<t${index}>${display}</t${index}>`;
  });
  return { masked, tags };
}
function unmask(text, tags) {
  let out = text;
  tags.forEach((tag, index) => {
    if (tag.opaque) out = out.replace(`<t${index}/>`, tag.whole);
    else
      out = out.replace(new RegExp(`<t${index}>([\\s\\S]*?)</t${index}>`), (_, shown) =>
        tag.type === 'b' || tag.type === 'i'
          ? `{@${tag.type} ${shown}}`
          : `{@${tag.type} ${tag.segments[0]}|${tag.segments[1] ?? ''}|${shown}}`,
      );
  });
  return out;
}
const markersOk = (text, tags) =>
  tags.every((tag, i) =>
    tag.opaque
      ? text.split(`<t${i}/>`).length === 2
      : text.split(`<t${i}>`).length === 2 &&
        text.split(`</t${i}>`).length === 2 &&
        text.indexOf(`<t${i}>`) < text.indexOf(`</t${i}>`),
  ) &&
  !/<\/?t\d+\/?>/.test(
    tags.reduce(
      (t, _, i) =>
        t.replaceAll(`<t${i}/>`, '').replaceAll(`<t${i}>`, '').replaceAll(`</t${i}>`, ''),
      text,
    ),
  );

// ---------- v3: protect dice, DCs and converted measurements ----------
const PT_UNIT = {
  meter: ['metro', 'metros'],
  kilometer: ['quilômetro', 'quilômetros'],
  kilogram: ['quilo', 'quilos'],
  centimeter: ['centímetro', 'centímetros'],
  liter: ['litro', 'litros'],
};
function protect(masked, tags) {
  const push = (restored) => {
    tags.push({ whole: restored, opaque: true });
    return `<t${tags.length - 1}/>`;
  };
  return masked
    .split(/(<\/?t\d+\/?>)/)
    .map((part) =>
      part.startsWith('<')
        ? part
        : part
            .replace(
              /(\d+(?:\.\d+)?)[- ](meter|kilometer|kilogram|centimeter|liter)s?\b/g,
              (_, n, unit) =>
                push(`${n.replace('.', ',')} ${PT_UNIT[unit][Number(n) < 2 ? 0 : 1]}`),
            )
            .replace(/\bDC (\d+)\b/g, (_, n) => push(`CD ${n}`))
            .replace(/\b\d*d\d+(?:\s*[+-]\s*\d+)?\b/g, (whole) => push(whole)),
    )
    .join('');
}
// Deterministic repair: drop marker wrappers the source never had, and repeated wrappers of the same id.
// It only removes wrappers, never text. Opaque markers are not repaired (a missing or repeated one stays invalid).
function repairMarkers(raw, tags) {
  let out = raw.replace(/<(\/?)t(\d+)(\/?)>/g, (whole, close, id, self) => {
    const tag = tags[Number(id)];
    if (!tag) return '';
    if (Boolean(tag.opaque) !== Boolean(self)) return '';
    return whole;
  });
  tags.forEach((tag, i) => {
    if (tag.opaque) return;
    let seen = 0;
    out = out.replace(new RegExp(`<t${i}>([\\s\\S]*?)</t${i}>`, 'g'), (whole, inner) =>
      seen++ ? inner : whole,
    );
  });
  return out;
}

// ---------- ICU structure (minimal parser: arguments, plural/select options, tags) ----------
function icuSignature(text) {
  let i = 0;
  const fail = (why) => {
    throw new Error(`icu: ${why} at ${i}`);
  };
  const parse = (untilBrace, untilTag) => {
    const nodes = [];
    while (i < text.length) {
      const ch = text[i];
      if (ch === '}') {
        if (untilBrace) return nodes;
        fail('unexpected }');
      }
      if (ch === '<' && text[i + 1] === '/') {
        const close = text.slice(i).match(/^<\/([a-zA-Z][\w-]*)>/);
        if (close && untilTag === close[1]) return nodes;
        if (close) fail(`unexpected </${close[1]}>`);
      }
      if (ch === '<') {
        const open = text.slice(i).match(/^<([a-zA-Z][\w-]*)>/);
        if (open) {
          i += open[0].length;
          const children = parse(false, open[1]);
          if (!text.startsWith(`</${open[1]}>`, i)) fail(`unclosed <${open[1]}>`);
          i += open[1].length + 3;
          nodes.push(`tag:${open[1]}(${children.sort().join(',')})`);
          continue;
        }
      }
      if (ch === '{') {
        i++;
        const head = text.slice(i).match(/^\s*([a-zA-Z_][\w.]*)\s*/);
        if (!head) fail('bad argument');
        i += head[0].length;
        if (text[i] === '}') {
          i++;
          nodes.push(`arg:${head[1]}`);
          continue;
        }
        if (text[i] !== ',') fail('expected , or }');
        i++;
        const kind = text.slice(i).match(/^\s*(plural|selectordinal|select|number|date|time)\s*/);
        if (!kind) fail('unknown argument type');
        i += kind[0].length;
        if (['number', 'date', 'time'].includes(kind[1])) {
          const end = text.indexOf('}', i);
          nodes.push(`${kind[1]}:${head[1]}:${text.slice(i, end).trim()}`);
          i = end + 1;
          continue;
        }
        if (text[i] !== ',') fail('expected options');
        i++;
        const options = [];
        for (;;) {
          const key = text.slice(i).match(/^\s*(=\d+|[a-zA-Z_][\w]*)\s*\{/);
          if (!key) break;
          i += key[0].length;
          const children = parse(true);
          i++;
          options.push(`${key[1]}[${children.sort().join(',')}]`);
        }
        const tail = text.slice(i).match(/^\s*\}/);
        if (!tail) fail('unclosed argument');
        i += tail[0].length;
        if (!options.length) fail('no options');
        nodes.push(`${kind[1]}:${head[1]}{${options.sort().join(';')}}`);
        continue;
      }
      i++;
    }
    if (untilBrace || untilTag) fail('unexpected end');
    return nodes;
  };
  return parse(false).sort().join(',');
}
const icuProblem = (source, target) => {
  let expected;
  try {
    expected = icuSignature(source);
  } catch {
    return null; // source is not ICU (rules text with stray braces): other checks apply
  }
  try {
    return icuSignature(target) === expected ? null : 'icu-structure';
  } catch {
    return 'icu-syntax';
  }
};

// ---------- glossary (terms as the approved pt of SRD 5.1 uses them) ----------
const GLOSSARY = [
  [/\bsaving throws?\b/i, 'salvaguarda', /salvaguarda/i],
  [/\bspell slots?\b/i, 'espaço de magia', /espaços? de magia/i],
  [/\bhit points?\b/i, 'pontos de vida', /pontos? de vida/i],
  [/\bdisadvantage\b/i, 'desvantagem', /desvantagem/i],
  [/(?<!dis)\badvantage\b/i, 'vantagem', /vantagem/i],
  [/\bbonus action\b/i, 'ação bônus', /aç(ão|ões) bônus/i],
  [/\battack rolls?\b/i, 'jogada de ataque', /jogadas? de ataque/i],
  [/\bability checks?\b/i, 'teste de atributo', /testes? de atributo/i],
  [/\bfire damage\b/i, 'dano ígneo', /ígneo/i],
  [/\bcold damage\b/i, 'dano gélido', /gélido/i],
  [/\blightning damage\b/i, 'dano elétrico', /elétrico/i],
  [/\bthunder damage\b/i, 'dano trovejante', /trovejante/i],
  [/\bforce damage\b/i, 'dano energético', /energético/i],
  [/\bradiant damage\b/i, 'dano radiante', /radiante/i],
  [/\bnecrotic damage\b/i, 'dano necrótico', /necrótico/i],
  [/\bpsychic damage\b/i, 'dano psíquico', /psíquico/i],
  [/\bacid damage\b/i, 'dano ácido', /ácido/i],
  [/\bpoison damage\b/i, 'dano venenoso', /venenoso|de veneno/i],
  [/\bcharmed\b/i, 'enfeitiçado', /enfeitiçad/i],
  [/\bfrightened\b/i, 'amedrontado', /amedrontad/i],
  [/\brestrained\b/i, 'contido', /contid/i],
  [/\bprone\b/i, 'caído', /caíd/i],
  [/\bstunned\b/i, 'atordoado', /atordoad/i],
  [/\bblinded\b/i, 'cego', /ceg/i],
  [/\bdeafened\b/i, 'surdo', /surd/i],
  [/\bincapacitated\b/i, 'incapacitado', /incapacitad/i],
  [/\bparalyzed\b/i, 'paralisado', /paralisad/i],
  [/\bunconscious\b/i, 'inconsciente', /inconsciente/i],
  [/\bundead\b/i, 'morto-vivo', /mort[oa]s?-viv[oa]s?/i],
  [/\bmelee\b/i, 'corpo a corpo', /corpo a corpo/i],
  [/\bconcentration\b/i, 'concentração', /concentração/i],
  [/\bcantrips?\b/i, 'truque', /truques?/i],
  [/\bcast(s|ing)?\b/i, 'conjurar', /conjur/i],
];
const termsFor = (source) => GLOSSARY.filter(([pattern]) => pattern.test(source));

// ---------- prompt ----------
const SYSTEM = `You translate Dungeons & Dragons 5e SRD rules text and app interface text from English to Brazilian Portuguese (pt-BR).
- Output only the translation. No notes, no quotes around it.
- Markers like <t0>text</t0> wrap game terms: keep each marker exactly once, with the same number, and translate only the text inside. Markers like <t1/> are copied unchanged. Never add a marker that is not in the source: if the same word appears again without a marker, or a spell name has no marker, leave it without one. Never drop a marker: keep the marked word as a word you can wrap.
- Keep placeholders such as {count} or {name}, ICU syntax ({count, plural, one {…} other {…}}; never translate the keywords plural, select, one, other) and tags such as <bold>…</bold> unchanged.
- Keep every number and dice expression (2d6, 1d8 + 3) exactly as written. Units are already metric; do not convert them again. Write decimals with a comma (1,5 metro).
- A spell is "magia" (never "feitiço"). Ability names: Strength = Força, Dexterity = Destreza, Constitution = Constituição, Intelligence = Inteligência, Wisdom = Sabedoria, Charisma = Carisma.
- Keep paragraph breaks and markdown (***bold italic***) as in the source.`;

const prepare = (item) => {
  const { masked, tags } = mask(convertUnits(item.source));
  if (VARIANT === 'v3' && item.group === 'rules') return { prepared: protect(masked, tags), tags };
  return { prepared: masked, tags };
};
const exampleTurns = examples.flatMap((example) => {
  const { masked: source, tags } = mask(convertUnits(example.source));
  // The reference keeps tags as {@condition charmed||enfeitiçada}; show it to the model in marker form.
  let index = 0;
  const target = example.reference.replace(/\{@(\w+) ([^}]*)\}/g, (whole, type, body) => {
    const i = index++;
    if (!tags[i] || tags[i].opaque) return `<t${i}/>`;
    const segments = body.split('|');
    return `<t${i}>${segments[2] ?? segments[0]}</t${i}>`;
  });
  return [
    { role: 'user', content: source },
    { role: 'assistant', content: target },
  ];
});

async function complete(messages) {
  const response = await fetch(`${URL_BASE}/v1/chat/completions`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      messages,
      temperature: 0.2,
      max_tokens: 4096,
      chat_template_kwargs: { enable_thinking: false },
    }),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  const body = await response.json();
  return {
    text: (body.choices[0].message.content ?? '').trim(),
    tokens: body.usage.completion_tokens,
  };
}

// ---------- checks ----------
const multiset = (text, pattern) =>
  (text.match(pattern) ?? [])
    .map((m) => m.toLowerCase().replace(/\s+/g, ''))
    .sort()
    .join('|');
const htmlTags = (text) => multiset(text, /<\/?[a-zA-Z][a-zA-Z0-9]*>/g);
const dice = (text) => multiset(text, /\b\d*d\d+\b/gi);
const balanced = (text) => {
  let depth = 0;
  for (const ch of text) {
    if (ch === '{') depth++;
    if (ch === '}') depth--;
    if (depth < 0) return false;
  }
  return depth === 0;
};
// Numbers outside tags and dice, with decimal comma or point treated alike.
const numbers = (text) =>
  (
    text
      .replace(/\{@[^}]*\}/g, ' ')
      .replace(/<\/?t\d+\/?>/g, ' ')
      .replace(/\b\d*d\d+\b/gi, ' ')
      .match(/\d+(?:[.,]\d+)?/g) ?? []
  )
    .map((n) => String(Number(n.replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.'))))
    .sort()
    .join('|');
const stripTags = (text) =>
  text.replace(/\{@\w+ ([^}]*)\}/g, (_, body) => body.split('|')[2] ?? body.split('|')[0]);

// chrF (character n-gram F-score, n = 1..6, beta = 2), whitespace removed.
function chrF(hypothesis, reference) {
  const grams = (text, n) => {
    const s = text.replace(/\s+/g, '');
    const map = new Map();
    for (let i = 0; i + n <= s.length; i++)
      map.set(s.slice(i, i + n), (map.get(s.slice(i, i + n)) ?? 0) + 1);
    return map;
  };
  let precision = 0;
  let recall = 0;
  let orders = 0;
  for (let n = 1; n <= 6; n++) {
    const h = grams(hypothesis, n);
    const r = grams(reference, n);
    const hTotal = [...h.values()].reduce((a, b) => a + b, 0);
    const rTotal = [...r.values()].reduce((a, b) => a + b, 0);
    if (!hTotal || !rTotal) continue;
    let overlap = 0;
    for (const [gram, count] of h) overlap += Math.min(count, r.get(gram) ?? 0);
    precision += overlap / hTotal;
    recall += overlap / rTotal;
    orders++;
  }
  if (!orders) return 0;
  precision /= orders;
  recall /= orders;
  return precision + recall === 0 ? 0 : (100 * 5 * precision * recall) / (4 * precision + recall);
}

function validate(item, prepared, tags, raw) {
  const problems = [];
  if (!raw) problems.push('empty');
  if (!markersOk(raw, tags)) problems.push('markers');
  if (item.group === 'ui') {
    const icu = icuProblem(prepared, raw);
    if (icu) problems.push(icu);
  }
  if (
    htmlTags(prepared.replace(/<\/?t\d+\/?>/g, '')) !== htmlTags(raw.replace(/<\/?t\d+\/?>/g, ''))
  )
    problems.push('html');
  if (!balanced(raw)) problems.push('braces');
  if (dice(prepared) !== dice(raw)) problems.push('dice');
  if (numbers(prepared) !== numbers(raw)) problems.push('numbers');
  if (/^(here is|aqui está|tradução:|translation:)/i.test(raw)) problems.push('preamble');
  return problems;
}

async function translate(item) {
  const started = performance.now();
  const { prepared, tags } = prepare(item);
  const terms = termsFor(item.source);
  const glossary = terms.length
    ? `\n\nGlossary for this text:\n${terms.map(([p, pt]) => `- ${p.source.replace(/\\b|\(\?<!dis\)|\(s\|ing\)\?|s\?/g, '')} = ${pt}`).join('\n')}`
    : '';
  const messages = [
    { role: 'system', content: SYSTEM + glossary },
    ...exampleTurns,
    { role: 'user', content: prepared },
  ];
  let raw = '';
  let problems = [];
  let firstProblems = null;
  let attempts = 0;
  let tokens = 0;
  const history = [];
  let repaired = false;
  const expectedMarkers =
    tags.map((tag, i) => (tag.opaque ? `<t${i}/>` : `<t${i}>…</t${i}>`)).join(' ') || 'none';
  for (; attempts < 3;) {
    attempts++;
    const turn = history.length
      ? [
          ...messages,
          { role: 'assistant', content: history.at(-1).raw },
          {
            role: 'user',
            content: `That answer is invalid (${history.at(-1).rawProblems.join(', ')}). The markers allowed are exactly: ${expectedMarkers}, each once. Numbers, dice and placeholders must match the source. Answer again with only the corrected translation.`,
          },
        ]
      : messages;
    const result = await complete(turn);
    raw = result.text;
    tokens += result.tokens;
    const rawProblems = validate(item, prepared, tags, raw);
    const fixed = rawProblems.includes('markers') ? repairMarkers(raw, tags) : raw;
    problems = fixed === raw ? rawProblems : validate(item, prepared, tags, fixed);
    history.push({ raw, rawProblems, repairedProblems: problems });
    firstProblems ??= rawProblems;
    if (!problems.length) {
      repaired = fixed !== raw;
      raw = fixed;
      break;
    }
  }
  const target = problems.includes('markers') ? raw : unmask(raw, tags);
  const missedTerms = terms.filter(([, , expected]) => !expected.test(target)).map(([, pt]) => pt);
  return {
    key: item.key,
    group: item.group,
    source: item.source,
    prepared,
    target,
    reference: item.reference,
    attempts,
    repaired,
    history,
    firstProblems,
    problems,
    glossaryTerms: terms.length,
    glossaryMissed: missedTerms,
    chrF: +chrF(stripTags(target), stripTags(item.reference)).toFixed(1),
    lengthRatio: +(target.length / item.source.length).toFixed(2),
    tokens,
    seconds: +((performance.now() - started) / 1000).toFixed(1),
  };
}

// ---------- run ----------
const queue = [...sample];
const results = [];
const failures = [];
const started = performance.now();
await Promise.all(
  Array.from({ length: PARALLEL }, async () => {
    for (let item = queue.shift(); item; item = queue.shift()) {
      try {
        results.push(await translate(item));
      } catch (error) {
        failures.push({ key: item.key, error: String(error) });
      }
    }
  }),
);
const wall = (performance.now() - started) / 1000;
const pct = (part, whole) => (whole ? +((100 * part) / whole).toFixed(1) : null);
const mean = (list) =>
  list.length ? +(list.reduce((a, b) => a + b, 0) / list.length).toFixed(1) : null;
const summarize = (rows) => {
  const terms = rows.reduce((a, r) => a + r.glossaryTerms, 0);
  const missed = rows.reduce((a, r) => a + r.glossaryMissed.length, 0);
  const count = (name, field) => rows.filter((r) => r[field].includes(name)).length;
  return {
    strings: rows.length,
    passFirstTryPct: pct(rows.filter((r) => !r.firstProblems.length).length, rows.length),
    passAfterRetriesPct: pct(rows.filter((r) => !r.problems.length).length, rows.length),
    stillFailing: Object.fromEntries(
      [
        'markers',
        'icu-structure',
        'icu-syntax',
        'html',
        'braces',
        'dice',
        'numbers',
        'empty',
        'preamble',
      ]
        .map((n) => [n, count(n, 'problems')])
        .filter(([, c]) => c),
    ),
    firstTryProblems: Object.fromEntries(
      [
        'markers',
        'icu-structure',
        'icu-syntax',
        'html',
        'braces',
        'dice',
        'numbers',
        'empty',
        'preamble',
      ]
        .map((n) => [n, count(n, 'firstProblems')])
        .filter(([, c]) => c),
    ),
    glossaryHitPct: pct(terms - missed, terms),
    glossaryTerms: terms,
    chrFMean: mean(rows.map((r) => r.chrF)),
    lengthRatioMean: +(rows.reduce((a, r) => a + r.lengthRatio, 0) / (rows.length || 1)).toFixed(2),
  };
};
const summary = {
  engine: ENGINE,
  variant: VARIANT,
  parallel: PARALLEL,
  wallSeconds: +wall.toFixed(1),
  failures: failures.length,
  completionTokens: results.reduce((a, r) => a + r.tokens, 0),
  all: summarize(results),
  rules: summarize(results.filter((r) => r.group === 'rules')),
  ui: summarize(results.filter((r) => r.group === 'ui')),
};
writeFileSync(OUT, JSON.stringify({ summary, failures, results }, null, 2));
console.log(JSON.stringify(summary, null, 2));

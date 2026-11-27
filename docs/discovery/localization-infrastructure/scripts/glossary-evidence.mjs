// Glossary evidence: string-level alignment of English terms against the APPROVED pt-BR in the repo.
// No dependencies, no network, read-only. Run from the repo root:
//
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs            # print report
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --csv      # also write the CSV
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --probe 'regex' [--src r51|r52|ui] [--n 12]
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --none '^long rest' --ptctx 'descans' [--n 6]
//                                                                                # strings with the English term but no candidate form
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --alone '^saving throw$' --form 'teste de resistência'
//                                                                                # strings where a rival form appears without the dominant one
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --examples   # real pairs for contextual/inconsistent rows
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --check33    # test the 33 entries of poc2-bench.mjs
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --editions   # 5.1 vs 5.2 name drift
//   node docs/discovery/localization-infrastructure/scripts/glossary-evidence.mjs --json | --only 'regex'
//
// Method: every string pair (same JSON path in en and pt, both non-empty) is one observation. For an
// English term (word-boundary regex, singular/plural) we take the observations whose English contains it
// and count which Portuguese candidate forms appear in the paired string. A candidate count is "strings
// whose pt contains the form", not "occurrences". Nothing here translates; it only measures.
//
// Limit: string-level, not word-level. When one string holds the term twice with two different
// renderings, both forms are counted once. A string that holds the term and a competing form for a
// different reason (e.g. "teste de resistência" inside a sentence about "save") can inflate a competitor;
// the `none` examples and `--probe` exist so a human can check.
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(import.meta.dirname, '../../../..');
const OUT_CSV = path.join(ROOT, 'docs/discovery/localization-infrastructure/proposals/glossary.pt-BR.csv');
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(`--${name}`);
const opt = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : fallback;
};
const readJson = (file) => JSON.parse(readFileSync(path.join(ROOT, file), 'utf8'));

// ---------- corpus ----------
const flatten = (obj, prefix = '', out = {}) => {
  for (const [key, value] of Object.entries(obj ?? {})) {
    const full = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') out[full] = value;
    else if (value && typeof value === 'object') flatten(value, full, out);
  }
  return out;
};

// 5etools tags: {@tag a|b|c}. Display text is segment 2 for most tags (the pt display lives there:
// {@condition charmed||enfeitiçada}), segment 1 for dc/dice/damage-like tags ({@dc 10|CD 10}).
const SHORT_TAGS = new Set(['dc', 'dice', 'damage', 'hit', 'd20', 'scaledamage', 'scaledice', 'chance', 'b', 'i']);
const stripTags = (text) => {
  let previous;
  do {
    previous = text;
    text = text.replace(/\{@(\w+)\s+([^{}]*)\}/g, (_, tag, body) => {
      const parts = body.split('|');
      if (SHORT_TAGS.has(tag)) return parts[1] || parts[0];
      return parts[2] || parts[0];
    });
  } while (text !== previous);
  return text;
};

const SOURCES = [
  { id: 'r51', label: '5.1 rules', dir: 'content/dnd5e/srd-5.1/i18n' },
  { id: 'r52', label: '5.2 rules', dir: 'content/dnd5e/srd-5.2/i18n' },
];
const corpus = [];
for (const s of SOURCES) {
  for (const file of ['spells', 'items', 'conditions', 'classes']) {
    const en = flatten(readJson(`${s.dir}/en/${file}.json`));
    const pt = flatten(readJson(`${s.dir}/pt/${file}.json`));
    for (const key of Object.keys(en)) {
      if (!en[key].trim() || !pt[key]?.trim()) continue;
      corpus.push({
        src: s.id,
        file,
        field: key.split('.').pop(),
        key: `${s.id}/${file}/${key}`,
        en: stripTags(en[key]),
        pt: stripTags(pt[key]),
        rawPt: pt[key],
        rawEn: en[key],
      });
    }
  }
}
{
  const en = flatten(readJson('messages/en.json'));
  const pt = flatten(readJson('messages/pt.json'));
  for (const key of Object.keys(en)) {
    if (!en[key].trim() || !pt[key]?.trim()) continue;
    corpus.push({ src: 'ui', file: 'messages', field: key, key: `ui/${key}`, en: en[key], pt: pt[key], rawPt: pt[key], rawEn: en[key] });
  }
}
const SRC_IDS = ['r51', 'r52', 'ui'];
const SRC_LABEL = { r51: '5.1', r52: '5.2', ui: 'UI' };
// "name" fields are short labels; "text" is everything else (descriptions, features, UI sentences).
const isName = (o) => o.field === 'name' || o.field === 'subclassTitle';

// ---------- probe mode ----------
if (flag('probe')) {
  const re = new RegExp(opt('probe'), 'i');
  const src = opt('src');
  const n = Number(opt('n', 12));
  const ptRe = opt('pt') ? new RegExp(opt('pt'), 'i') : null;
  const win = Number(opt('w', 90));
  let shown = 0;
  let total = 0;
  for (const o of corpus) {
    if (src && o.src !== src) continue;
    const m = re.exec(o.en);
    if (!m) continue;
    total++;
    if (ptRe && !ptRe.test(o.pt)) continue;
    if (shown >= n) continue;
    // pick every n-th to spread over the corpus
    if (total % Math.max(1, Number(opt('step', 1))) !== 0) continue;
    shown++;
    const ctx = (s, i, len) => s.slice(Math.max(0, i - win), Math.min(s.length, i + len + win)).replace(/\s+/g, ' ');
    // --ptctx 'regex' shows the Portuguese around that regex instead of the start of the string
    const pm = opt('ptctx') ? new RegExp(opt('ptctx'), 'i').exec(o.pt) : null;
    const ptShown = pm ? `...${ctx(o.pt, pm.index, pm[0].length)}...` : o.pt.replace(/\s+/g, ' ').slice(0, win * 3);
    console.log(`[${o.key}]\n  EN: ...${ctx(o.en, m.index, m[0].length)}...\n  PT: ${ptShown}`);
  }
  console.log(`\n${total} matching strings`);
  process.exit(0);
}

// ---------- measurement engine ----------
// Word boundary that understands accents (\b does not): used for both languages.
const W = (src, flags = 'iu') => new RegExp(`(?<![\\p{L}\\p{N}])(?:${src})(?![\\p{L}\\p{N}])`, flags.includes('g') ? flags : `${flags}g`);

// Thresholds for the automatic class (a human reviews every row; `cls` in a term overrides).
const UNCONDITIONAL_SHARE = 0.95; // dominant form covers at least this share of the strings with the English term
const COMPETITOR_SHARE = 0.1; // another form at this share (and >= 2 strings) means the pt itself is split

const TERMS = [];
// T(en, reSource, forms, options). forms = [[label, ptRegexSource], ...].
// options: text (skip name fields), cs (case-sensitive English), ok(before, after, match), only (sources),
//          sense, cls (manual class), note, group.
const T = (en, re, forms, o = {}) => TERMS.push({ en, re, forms, ...o });

// ----- time and turn structure -----
T('round', 'rounds?', [['rodada', 'rodadas?'], ['turno', 'turnos?']], {
  group: 'time',
  sense: 'combat round (time unit)',
  text: true,
  ok: (b, a) => !/^\s+(?:up|down)\b/i.test(a),
});
T('round (verb: round up/down)', 'round(?:s|ed|ing)?(?=\\s+(?:up|down))', [['arredondar', 'arredond\\p{L}*']], {
  group: 'time',
  sense: 'to round a number up or down',
  text: true,
  cls: 'contextual',
});
// "turn" as a noun follows a determiner or possessive ("your turn", "each of its turns"); everything else is the verb.
const TURN_NOUN_BEFORE = /(?:your|its|their|his|her|my|each|next|that|this|a|the|first|own|subsequent|every|whose|current|per|of|on|or|and|one|another|an|any|extra|creature's|target's|'s)\s$/i;
const TURN_VERB_AFTER = /^\s+(?:into|to stone|ordinary|one creature|it\b|them\b|an? |the (?:ground|flesh)|clear|difficult|away|back)/i;
const isTurnNoun = (b, a, m, en) => !/undead/i.test(a) && ((TURN_NOUN_BEFORE.test(b) && !TURN_VERB_AFTER.test(a)) || (b.trim() === '' && !TURN_VERB_AFTER.test(a)) || /^\s+of yours/i.test(a));
T('turn (noun)', 'turns?', [['turno', 'turnos?'], ['vez', 'vez(?:es)?']], {
  group: 'time',
  sense: 'a creature\'s turn in combat',
  text: true,
  ok: isTurnNoun,
  note: '"vez" counted alone = UI combat labels; "uma vez por turno" is a different word and is not counted as a rival',
});
T('turn (verb: transform)', 'turn(?:s|ed|ing)?', [
  ['transformar', 'transform\\p{L}*'],
  ['tornar', 'torn\\p{L}*'],
  ['converter', 'convert\\p{L}*'],
  ['em pedra', 'em pedra'],
], {
  group: 'time',
  sense: 'to turn X into Y / turned to stone',
  text: true,
  ok: (b, a, m, en) => !isTurnNoun(b, a, m, en) && !/undead/i.test(a) && !/^turned$/i.test(m),
  cls: 'contextual',
});
T('Turn Undead / turned (Channel Divinity)', 'turn undead|turned|turn(?:s|ing)? (?:the )?undead|turn (?:one|a) creature', [
  ['expulsar', 'expuls\\p{L}*'],
  ['afastar', 'afast\\p{L}*'],
  ['repelir', 'repel\\p{L}*'],
], { group: 'time', sense: 'Turn Undead (cleric)', cls: 'contextual', note: 'only cleric/paladin text and the spells that mention it' });
T('initiative', 'initiative', [['iniciativa', 'iniciativas?']], { group: 'time', sense: 'initiative' });
T('action', 'actions?', [['ação', 'aç(?:ão|ões)']], {
  group: 'time',
  sense: 'action (what you do on your turn)',
  text: true,
  ok: (b, a) => !/^\s+(?:surge|economy)/i.test(a),
});
T('bonus action', 'bonus actions?', [['ação bônus', 'aç(?:ão|ões) b[ôo]nus'], ['ação adicional', 'aç(?:ão|ões) adicional\\p{L}*']], { group: 'time', sense: 'bonus action' });
T('reaction', 'reactions?', [['reação', 'reaç(?:ão|ões)']], {
  group: 'time',
  sense: 'reaction (game action)',
  text: true,
  ok: (b, a) => !/(?:chemical|allergic)/i.test(b),
});
T('party', 'part(?:y|ies)', [['mesa', 'mesas?'], ['grupo', 'grupos?'], ['party', 'partys?|parties'], ['festa', 'festas?']], {
  group: 'time',
  sense: 'party in the app (a shared table: members, GM, chest, journal)',
  only: ['ui'],
  note: 'UI: the app calls the party a "mesa"',
});
T('party (rules text)', 'part(?:y|ies)', [['grupo', 'grupos?'], ['mesa', 'mesas?'], ['festa', 'festas?'], ['companheiros', 'companheir\\p{L}*']], {
  group: 'time',
  sense: 'party (adventuring group) in SRD rules text',
  only: ['r51', 'r52'],
});
T('long rest', 'long rests?', [['descanso longo', 'descansos? longos?|descansos? curtos? (?:ou|e) longos?']], { group: 'time', sense: 'long rest' });
T('short rest', 'short rests?', [['descanso curto', 'descansos? curtos?']], { group: 'time', sense: 'short rest' });
T('rest (verb)', 'rest(?:s|ed|ing)?', [['descansar', 'descans\\p{L}*']], {
  group: 'time',
  sense: 'rest in general',
  text: true,
  ok: (b, a) => !/^\s+(?:of|on)\b/.test(a) && !/(?:long|short)\s$/i.test(b),
  cls: 'contextual',
});
T('for the duration (idiom)', 'for the duration', [['enquanto a magia durar', 'dur(?:ar|a|e|ante)'], ['duração', 'dura(?:ção|ções)']], { group: 'time', sense: 'idiom "for the duration" (spell lasts)', text: true });
T('duration (noun, other uses)', 'duration', [['duração', 'dura(?:ção|ções)'], ['durar', 'dur(?:ar|a|e|ante)']], { group: 'time', sense: 'the duration as a noun ("for the duration of", "Duration")', text: true, ok: (b, a) => !/for the $/i.test(b) });

// ----- rolls and checks -----
T('saving throw', 'saving throws?', [
  ['salvaguarda', 'salvaguardas?'],
  ['teste de resistência', 'testes? de resist[êe]ncia'],
  ['jogada de proteção', 'jogadas? de prote[çc][ãa]o'],
  ['teste de salvaguarda', 'testes? de salvaguarda'],
], { group: 'rolls', sense: 'saving throw' });
T('save (noun, after "saving throw")', 'saves?', [
  ['salvaguarda', 'salvaguardas?'],
  ['teste de resistência', 'testes? de resist[êe]ncia'],
  ['salvar', 'salv(?:ar|e|o)'],
  ['guardar', 'guard(?:ar|e)'],
], {
  group: 'rolls',
  sense: '"save" as the short form of saving throw (on a failed/successful save, save DC)',
  ok: (b, a) => /(?:failed|successful|failure|spell|its|their|your|the|a|another|new|each|every)\s$/i.test(b) && !/^\s+(?:all|changes|settings)/i.test(a),
  cls: 'contextual',
  note: 'en "Save" as a button label (UI) means "Salvar"; see the UI rows below',
});
T('Save (button label)', 'Save(?: all| changes)?|Saved|Saving', [['salvar', 'salv(?:ar|ando|ou|a)\\p{L}*'], ['guardar', 'guard(?:ar|ando)']], {
  group: 'rolls',
  sense: 'Save = store (UI button)',
  only: ['ui'],
  cs: true,
  ok: (b, a, m, en) => !/(?:saving throw|death|spell)/i.test(en),
  cls: 'contextual',
});
T('death saving throw', 'death sav(?:ing throw|e)s?', [
  ['teste contra a morte', 'testes? contra (?:a )?morte'],
  ['salvaguarda contra a morte', 'salvaguardas? contra (?:a )?morte'],
  ['(elíptico) "e contra a morte"', '(?:e|ou) contra (?:a )?morte'],
], { group: 'rolls', sense: 'death saving throw' });
T('ability check', 'ability checks?', [['teste de atributo', 'testes? de atributos?'], ['teste de habilidade', 'testes? de habilidade']], { group: 'rolls', sense: 'ability check' });
T('check (ability name + check)', '(?:Strength|Dexterity|Constitution|Intelligence|Wisdom|Charisma)(?: \\([A-Za-z ]+\\))? checks?', [
  ['teste', 'testes?'],
  ['jogada', 'jogadas?'],
], { group: 'rolls', sense: 'Strength check / Wisdom (Perception) check', text: true });
T('skill check', 'skill checks?', [['teste de perícia', 'testes? de per[íi]cia'], ['teste de', 'testes? de']], { group: 'rolls', sense: 'skill check', note: 'rare in the corpus' });
T('check (verb, "check your internet")', 'check(?:s|ed|ing)?', [['verificar', 'verific\\p{L}*'], ['conferir', 'confer\\p{L}*']], {
  group: 'rolls',
  sense: 'to check / verify (not a game roll)',
  only: ['ui'],
  ok: (b, a) => !/(?:ability|strength|dexterity|constitution|intelligence|wisdom|charisma)/i.test(b + a),
  cls: 'contextual',
});
T('attack roll', 'attack rolls?', [['jogada de ataque', 'jogadas? de ataque'], ['rolagem de ataque', 'rolagem de ataque|rolagens de ataque'], ['teste de ataque', 'testes? de ataque']], { group: 'rolls', sense: 'attack roll' });
T('damage roll', 'damage rolls?', [['jogada de dano', 'jogadas? de dano'], ['rolagem de dano', 'rolagem de dano|rolagens de dano']], { group: 'rolls', sense: 'damage roll' });
T('advantage', '(?<!dis)advantage', [['vantagem', 'vantagem|vantagens']], { group: 'rolls', sense: 'advantage (d20)' });
T('disadvantage', 'disadvantage', [['desvantagem', 'desvantagem|desvantagens']], { group: 'rolls', sense: 'disadvantage (d20)' });
T('proficiency bonus', 'proficiency bonus', [['bônus de proficiência', 'b[ôo]nus de profici[êe]ncia']], { group: 'rolls', sense: 'proficiency bonus' });
T('proficiency / proficient', 'profici(?:ent|ency|encies)', [['proficiência/proficiente', 'profici[êe]nci\\p{L}*|proficient\\p{L}*']], { group: 'rolls', sense: 'proficiency' });
T('expertise', 'expertise', [['especialização', 'especializa[çc][ãa]o'], ['especialista', 'especialistas?']], {
  group: 'rolls',
  sense: 'expertise (double proficiency)',
  note: 'UI uses "Especialista" for Expertise (skills.expertise)',
});
T('inspiration', 'inspiration', [['inspiração', 'inspira[çc][ãa]o']], { group: 'rolls', sense: 'inspiration (and Bardic Inspiration)' });
T('critical hit', 'critical hits?', [['acerto crítico', 'acertos? cr[íi]ticos?']], { group: 'rolls', sense: 'critical hit' });
T('modifier', 'modifiers?', [['modificador', 'modificador(?:es)?']], { group: 'rolls', sense: 'ability modifier', text: true });
T('passive (Perception)', 'passive', [['passiva', 'passiv[ao]s?']], { group: 'rolls', sense: 'passive Perception' });
T('roll (verb)', 'roll(?:s|ed|ing)?', [['rolar', 'rol(?:ar|e|a|ou|am|ando|agem|agens|ada|adas|ados)'], ['jogar', 'jog(?:ar|ue|a|ou|am|ando)']], {
  group: 'rolls',
  sense: 'to roll dice (verb)',
  text: true,
  ok: (b, a, m) => !/^rolls?$/i.test(m) || !/(?:attack|damage|saving)\s$/i.test(b),
  cls: 'contextual',
  note: 'noun "attack roll" is "jogada de ataque", verb "roll" is "role/rolar"',
});

// ----- hit points, AC, speed -----
T('hit points', 'hit points?', [['pontos de vida', 'pontos? de vida'], ['PV', 'PVs?']], { group: 'stats', sense: 'hit points (long form)' });
T('HP (abbreviation)', 'HP', [['PV', 'PVs?'], ['pontos de vida', 'pontos? de vida'], ['HP', 'HPs?'], ['vida', 'vida']], { group: 'stats', sense: 'HP abbreviation', cs: true, only: ['ui'] });
T('temporary hit points', 'temporary hit points?|temp(?:orary)? HP', [
  ['pontos de vida temporários', 'pontos? de vida tempor[áa]ri\\p{L}*'],
  ['PV temporário', 'PVs? tempor[áa]ri\\p{L}*'],
  ['vida temporária', 'vida tempor[áa]ria'],
], { group: 'stats', sense: 'temporary hit points' });
T('hit points maximum', 'hit point maximum|max(?:imum)? (?:hit points|HP)', [
  ['máximo de pontos de vida', 'm[áa]ximo de pontos de vida|pontos de vida m[áa]ximos'],
  ['PV máximo', 'PVs? m[áa]ximos?|m[áa]ximo de PV'],
], { group: 'stats', sense: 'hit point maximum' });
T('hit dice', 'hit dic?e', [['dado de vida', 'dados? de vida']], { group: 'stats', sense: 'Hit Dice', cs: false });
T('armor class', 'armor class', [['Classe de Armadura', 'classes? de armadura']], { group: 'stats', sense: 'armor class (long form)' });
T('AC', 'AC', [['CA', 'CA'], ['Classe de Armadura', 'classes? de armadura'], ['AC', 'AC']], { group: 'stats', sense: 'armor class abbreviation', cs: true });
T('DC', 'DC', [['CD', 'CD'], ['Classe de Dificuldade', 'classes? de dificuldade'], ['DC', 'DC']], { group: 'stats', sense: 'difficulty class abbreviation', cs: true });
T('difficulty class', 'difficulty class', [['Classe de Dificuldade', 'classes? de dificuldade'], ['CD', 'CD']], { group: 'stats', sense: 'difficulty class (long form)' });
T('challenge rating', 'challenge rating', [['nível de desafio', 'n[íi]vel de desafio'], ['ND', 'ND'], ['CR', 'CR']], { group: 'stats', sense: 'challenge rating (long form)' });
T('CR', 'CR', [['ND', 'ND'], ['nível de desafio', 'n[íi]vel de desafio'], ['CR', 'CR']], { group: 'stats', sense: 'challenge rating abbreviation', cs: true });
T('speed', 'speed', [['deslocamento', 'deslocamento'], ['velocidade', 'velocidade']], { group: 'stats', sense: 'movement speed (noun)', text: true, note: 'spell Slow/Haste also use "speed"; see none examples' });
T('range', 'range', [['alcance', 'alcance'], ['intervalo', 'intervalo']], { group: 'stats', sense: 'range of a spell/attack', text: true, ok: (b, a) => !/^\s+of\s+(?:motion|sizes)/.test(a) });
T('melee', 'melee', [['corpo a corpo', 'corpo a corpo']], { group: 'stats', sense: 'melee' });
T('ranged', 'ranged', [['à distância', '[àa] dist[âa]ncia']], { group: 'stats', sense: 'ranged' });
T('target', 'targets?', [['alvo', 'alvos?']], { group: 'stats', sense: 'target (noun)', text: true, ok: (b, a) => !/(?:^|\s)to\s$/.test(b) });
T('target (verb)', 'target(?:s|ed|ing)?', [['atingir', 'ating\\p{L}*'], ['alvo', 'alvos?'], ['mirar', 'mir(?:ar|a|e)'], ['afetar', 'afet\\p{L}*'], ['escolher', 'escolh\\p{L}*']], {
  group: 'stats',
  sense: 'to target (verb)',
  text: true,
  ok: (b, a) => /(?:^|\s)(?:to|you|can|may|which|that|it|and|or)\s$/.test(b) || /^ed/.test(a),
  cls: 'contextual',
});
T('cover', 'cover', [['cobertura', 'cobertura'], ['cobrir', 'cobr(?:ir|e|a|o)\\p{L}*']], { group: 'stats', sense: 'cover (half/three-quarters) vs to cover', text: true, cls: 'contextual' });
T('difficult terrain', 'difficult terrain', [['terreno difícil', 'terreno dif[íi]cil']], { group: 'stats', sense: 'difficult terrain' });
T('resistance (damage)', 'resistances?', [['resistência', 'resist[êe]nci\\p{L}*']], { group: 'stats', sense: 'damage resistance', text: true });
T('resist (damage, verb)', 'resist(?:s|ed|ing)?', [['resistir', 'resist(?:ir|e|a|ência)\\p{L}*']], { group: 'stats', sense: 'to resist / resistance in non-damage sense', text: true, cls: 'contextual', ok: (b, a) => !/^\s+to\s/i.test(b) });
T('immunity / immune', 'immun(?:e|ity|ities)', [['imune/imunidade', 'imun\\p{L}*']], { group: 'stats', sense: 'immunity' });
T('vulnerability', 'vulnerab\\p{L}*', [['vulnerabilidade', 'vulnerab\\p{L}*']], { group: 'stats', sense: 'vulnerability' });
T('creature', 'creatures?', [['criatura', 'criaturas?']], { group: 'stats', sense: 'creature', text: true });
T('object', 'objects?', [['objeto', 'objetos?']], { group: 'stats', sense: 'object (noun)', text: true });
T('willing creature', 'willing creature', [['criatura voluntária', 'criaturas? volunt[áa]ri\\p{L}*']], { group: 'stats', sense: 'willing creature' });
T('hostile', 'hostile', [['hostil', 'hostis|hostil']], { group: 'stats', sense: 'hostile' });
T('Dungeon Master (long)', 'Dungeon Master', [['Mestre', 'mestre'], ['DM', 'DM'], ['Mestre de Masmorra', 'mestre de masmorra\\p{L}*']], { group: 'stats', sense: 'Dungeon Master' });
T('DM', 'DM', [['Mestre', 'mestre'], ['DM', 'DM']], { group: 'stats', sense: 'DM', cs: true });
T('GM', 'GM', [['Mestre', 'mestre'], ['DM', 'DM'], ['GM', 'GM']], { group: 'stats', sense: 'GM (the app uses GM in English)', cs: true });
// "level" has two readings. Numbered levels ("5th level") are a character level after reach/at/beginning at,
// and a spell level otherwise; class text is character level by default.
const LEVEL_RE = '(?:\\d+(?:st|nd|rd|th)[- ]|(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)[- ])?levels?';
const CHAR_LEAD = /(?:reach(?:es)?|at|beginning at|starting at|from|until|by|achieve|gain)\s$/i;
const levelSense = (b, a, m, en, o) => {
  const numbered = /^(?:\d|first|second|third|fourth|fifth|sixth|seventh|eighth|ninth)/i.test(m);
  if (numbered) {
    if (CHAR_LEAD.test(b) || /you reach (?:\d|higher)/i.test(en)) return 'char';
    if (o.file === 'classes') return /^\s+(?:spell|spells|or higher|slot)/i.test(a) || /(?:spell slot of|slots? of)\s$/i.test(b) ? 'spell' : 'char';
    return 'spell';
  }
  if (/(?:slot|spell|each|above|same|higher|lower|of the spell|spell's)\s$/i.test(b) || /^\s+(?:or higher|or lower|above|of the spell|spell)/i.test(a)) return 'spell';
  if (/(?:your|character|class|total|caster|creature's|exhaustion|its|their|that|this|the)\s(?:\w+\s)?$/i.test(b) || b.trim() === '') return 'char';
  return 'other';
};
T('level (spell level / slot level)', LEVEL_RE, [
  ['círculo', 'c[íi]rculos?'],
  ['nível', 'n[íi]veis|n[íi]vel'],
], { group: 'magic', sense: 'spell level / slot level (heuristic from context)', text: true, ok: (b, a, m, en, o) => levelSense(b, a, m, en, o) === 'spell' });
T('spell level in the UI (Circle / slots by level)', 'Circle \\{|Level \\{level\\} (?:slot|Spells)|Slots per level|slots? by level|by level', [['nível', 'n[íi]veis|n[íi]vel'], ['círculo', 'c[íi]rculos?']], {
  group: 'magic',
  sense: 'spell level as labelled in the UI (en "Circle {level}" is "Nível {level}")',
  only: ['ui'],
  note: 'owner decision recorded in docs/revisao-telas/fase-1-resultados.md (glossary: "Nível" for spell slots); rules content uses "círculo"',
});
T('level (character / class / creature / exhaustion)', LEVEL_RE, [['nível', 'n[íi]veis|n[íi]vel'], ['círculo', 'c[íi]rculos?']], {
  group: 'magic',
  sense: 'character, class, creature or exhaustion level (heuristic from context)',
  ok: (b, a, m, en, o) => levelSense(b, a, m, en, o) === 'char',
  cls: 'contextual',
  note: 'same English word, two Portuguese words depending on what has the level',
});

// ----- magic -----
T('spell slot', 'spell slots?', [['espaço de magia', 'espa[çc]os? de magia'], ['slot de magia', 'slots? de magia'], ['espaço de conjuração', 'espa[çc]os? de conjura[çc][ãa]o']], { group: 'magic', sense: 'spell slot' });
T('pact slot', 'pact slots?', [['espaço de pacto', 'espa[çc]os? de pacto'], ['espaço de magia', 'espa[çc]os? de magia']], { group: 'magic', sense: 'pact slot' });
T('Pact Magic', 'Pact Magic', [['Magia de Pacto', 'magia de pacto']], { group: 'features', sense: 'Warlock: Pact Magic' });
T('cantrip', 'cantrips?', [['truque', 'truques?']], { group: 'magic', sense: 'cantrip' });
T('spell', 'spells?', [['magia', 'magias?'], ['feitiço', 'feiti[çc]os?']], { group: 'magic', sense: 'spell', text: true });
T('concentration', 'concentration', [['concentração', 'concentra[çc][ãa]o']], { group: 'magic', sense: 'concentration (spell)', note: 'also the ordinary meaning "focus"; no other sense found in this corpus' });
T('ritual', 'rituals?', [['ritual', 'rituais|ritual']], { group: 'magic', sense: 'ritual (casting)' });
T('cast (spell)', 'cast(?:s|ing)?', [['conjurar', 'conjur\\p{L}*'], ['lançar', 'lan[çc]\\p{L}*']], {
  group: 'magic',
  sense: 'to cast a spell (verb)',
  text: true,
  ok: (b, a) => !/(?:^|\s)(?:a|the)\s$/i.test(b) && !/^\s+(?:iron|net|shadow|of|gem|dice|lots|into)/i.test(a),
  note: 'poc2-bench regex /\\bcast(s|ing)?\\b/ is fine for the spell sense; "cast" the noun (cast iron, a cast of characters) is not found in the corpus',
});
T('cast (throw / cast into)', 'casting (?:gem|dice|lots)|(?:is|are|be|been|usually) cast into|casts? (?:a )?(?:shadow|light)', [['lançar', 'lan[çc]\\p{L}*'], ['conjurar', 'conjur\\p{L}*']], {
  group: 'magic',
  sense: 'cast = throw / cast into (not a spell)',
  text: true,
  cls: 'contextual',
});
T('spellcasting', 'spellcasting', [['conjuração', 'conjura[çc][ãa]o']], { group: 'magic', sense: 'Spellcasting (class feature / ability)' });
T('spellcasting ability', 'spellcasting abilit(?:y|ies)', [['atributo de conjuração', 'atributos? de conjura[çc][ãa]o'], ['habilidade de conjuração', 'habilidades? de conjura[çc][ãa]o']], { group: 'magic', sense: 'spellcasting ability' });
T('spell attack', 'spell attacks?', [['ataque mágico', 'ataques? m[áa]gic\\p{L}*'], ['ataque de magia', 'ataques? de magia']], { group: 'magic', sense: 'spell attack' });
T('spell save DC', 'spell save DC', [['CD', 'CD'], ['CD de magia', 'CD (?:de|das|da) magia']], { group: 'magic', sense: 'spell save DC' });
T('caster', 'casters?', [['conjurador', 'conjurador\\p{L}*']], { group: 'magic', sense: 'caster (noun)', text: true, note: 'absent in the corpus: see no-evidence' });
T('component (verbal/somatic/material)', 'components?', [['componente', 'componentes?']], { group: 'magic', sense: 'spell component', text: true });
T('casting time', 'casting time', [['tempo de conjuração', 'tempo de conjura[çc][ãa]o']], { group: 'magic', sense: 'casting time' });
T('concentration (verb "concentrate")', 'concentrate|concentrating', [['concentrar', 'concentr\\p{L}*']], { group: 'magic', sense: 'to concentrate', text: true });
T('prepared spell', 'prepar(?:e|ed|es|ing)', [['preparar', 'prepar\\p{L}*']], { group: 'magic', sense: 'to prepare spells', text: true });
T('school of magic', 'schools? of', [['escola', 'escolas?']], { group: 'magic', sense: 'school of magic', text: true });
T('Wild Shape', 'Wild Shape', [['Forma Selvagem', 'forma selvagem']], { group: 'features', sense: 'Druid: Wild Shape' });
T('Channel Divinity', 'Channel Divinity', [['Canalizar Divindade', 'canalizar divindade']], { group: 'features', sense: 'Cleric/Paladin: Channel Divinity' });
T('Sneak Attack', 'Sneak Attack', [['Ataque Furtivo', 'ataque furtivo']], { group: 'features', sense: 'Rogue: Sneak Attack' });
T('Rage (Barbarian)', 'rage|raging', [['Fúria', 'f[úu]ria']], { group: 'features', sense: 'Barbarian: Rage / to rage', text: true, note: '"rage" other senses: none found' });
T('Bardic Inspiration', 'Bardic Inspiration', [['Inspiração de Bardo', 'inspira[çc][ãa]o de bardo']], { group: 'features', sense: 'Bard: Bardic Inspiration' });
T('Lay on Hands', 'Lay on Hands', [['Mãos Consagradas', 'm[ãa]os consagradas']], { group: 'features', sense: 'Paladin: Lay on Hands' });
T('Divine Smite', 'Divine Smite', [['Destruição Divina', 'destrui[çc][ãa]o divina'], ['Punição Divina', 'puni[çc][ãa]o divina']], { group: 'features', sense: 'Paladin: Divine Smite' });
T('Second Wind', 'Second Wind', [['Recuperar o Fôlego', 'recuperar o f[ôo]lego'], ['Retomar o Fôlego', 'retomar o f[ôo]lego']], { group: 'features', sense: 'Fighter: Second Wind' });
T('Action Surge', 'Action Surge', [['Surto de Ação', 'surto de a[çc][ãa]o']], { group: 'features', sense: 'Fighter: Action Surge' });
T('Extra Attack', 'Extra Attack', [['Ataque Extra', 'ataque extra']], { group: 'features', sense: 'Extra Attack' });
T('Favored Enemy', 'Favored Enem(?:y|ies)', [['Inimigo Favorito', 'inimigos? favorit\\p{L}*']], { group: 'features', sense: 'Ranger: Favored Enemy' });
T('Cunning Action', 'Cunning Action', [['Ação Ardilosa', 'a[çc][ãa]o ardilosa']], { group: 'features', sense: 'Rogue: Cunning Action' });
T('Sorcery Points', 'Sorcery Points?', [['pontos de feitiçaria', 'pontos? de feiti[çc]aria']], { group: 'features', sense: 'Sorcerer: Sorcery Points' });
T('Metamagic', 'Metamagic', [['Metamagia', 'metamagia']], { group: 'features', sense: 'Sorcerer: Metamagic' });
T('Evasion', 'Evasion', [['Evasão', 'evas[ãa]o']], { group: 'features', sense: 'Evasion' });
T('opportunity attack', 'opportunity attacks?', [['ataque de oportunidade', 'ataques? de oportunidade']], { group: 'features', sense: 'opportunity attack' });
T('unarmed strike', 'unarmed strikes?', [['golpe desarmado', 'golpes? desarmados?'], ['ataque desarmado', 'ataques? desarmados?']], { group: 'features', sense: 'unarmed strike' });
T('weapon attack', 'weapon attacks?', [['ataque com arma', 'ataques? com arma'], ['ataque armado', 'ataques? armados?']], { group: 'features', sense: 'weapon attack' });
T('attunement', 'attun\\p{L}*', [['sintonia/sintonizar', 'sintoni\\p{L}*']], { group: 'features', sense: 'attunement (magic items)' });
T('darkvision', 'darkvision', [['visão no escuro', 'vis[ãa]o no escuro']], { group: 'features', sense: 'darkvision' });
T('line of sight', 'line of sight', [['linha de visão', 'linha de vis[ãa]o']], { group: 'features', sense: 'line of sight' });
T('stabilize', 'stabili[sz]\\p{L}*', [['estabilizar', 'estabiliz\\p{L}*']], { group: 'features', sense: 'stabilize (0 HP)' });
T('death (0 HP)', 'death', [['morte', 'morte']], { group: 'features', sense: 'death', text: true });

// ----- other mechanically significant words (checked for second meanings) -----
const HIT_NOT_POINTS = (a) => !/^\s+(?:points?|dic?e|die)\b/i.test(a);
T('hit (noun: "on a hit")', 'hit', [['acerto', 'acert\\p{L}*'], ['atingir', 'ating\\p{L}*']], {
  group: 'rolls',
  sense: 'noun: "On a hit, the target takes..."',
  text: true,
  ok: (b, a) => HIT_NOT_POINTS(a) && /(?:on|a|each|every|the)\s$/i.test(b) && !/(?:critical|crit)\s$/i.test(b),
  cls: 'contextual',
});
T('hit (verb: "if you hit a creature")', 'hit(?:s|ting)?', [['acertar', 'acert\\p{L}*'], ['atingir', 'ating\\p{L}*'], ['golpear', 'golpe\\p{L}*']], {
  group: 'rolls',
  sense: 'verb: you hit / the attack hits',
  text: true,
  ok: (b, a) => HIT_NOT_POINTS(a) && !/(?:on|a|each|every|the|critical)\s$/i.test(b),
  cls: 'contextual',
});
T('miss', 'miss(?:es)?', [['errar', 'err(?:ar|a|ou|o)'], ['erro', 'erro'], ['falhar', 'falh\\p{L}*']], { group: 'rolls', sense: 'miss (attack)', text: true });
T('damage (noun)', 'damage', [['dano', 'danos?']], { group: 'rolls', sense: 'damage (noun)', text: true });
T('regain (hit points)', 'regains?', [['recuperar', 'recuper\\p{L}*'], ['curar', 'cur(?:ar|a|e|ado|ada)'], ['ganhar', 'ganh\\p{L}*']], { group: 'rolls', sense: 'regain hit points', text: true });
T('heal', 'heal(?:s|ed|ing)?', [['curar', 'cur(?:ar|a|e|ado|ada)'], ['recuperar', 'recuper\\p{L}*']], { group: 'rolls', sense: 'heal (verb)', text: true });
T('bonus (numeric)', '[+]\\d+ bonus|bonus to|bonus', [['bônus', 'b[ôo]nus']], {
  group: 'rolls',
  sense: 'numeric bonus (noun); not "bonus action"',
  text: true,
  ok: (b, a) => !/^\s+action/i.test(a),
});
T('reach (verb: reach a level / reach a place)', 'reach(?:es|ed|ing)?', [['alcançar', 'alcan[çc]\\p{L}*'], ['atingir', 'ating\\p{L}*'], ['chegar', 'cheg\\p{L}*']], {
  group: 'stats',
  sense: 'reach as a verb',
  text: true,
  ok: (b, a) => /(?:you|it|they|creature|target|when|until|once|that|which|to|can)\s$/i.test(b),
  cls: 'contextual',
});
T('reach (noun: melee reach)', 'reach', [['alcance', 'alcance']], {
  group: 'stats',
  sense: 'reach as a noun (weapon / creature reach)',
  text: true,
  ok: (b, a) => /(?:your|its|their|a|the|within|beyond|out of|has|with)\s$/i.test(b),
  cls: 'contextual',
});
T('light (adjective: light armor / weapon)', 'light', [['leve', 'leves?']], {
  group: 'stats',
  sense: 'light = not heavy (armor, weapon, load)',
  text: true,
  ok: (b, a) => /^\s+(?:armor|weapons?|crossbow|hammer|load|shield)/i.test(a),
  cls: 'contextual',
});
T('light (noun: illumination)', 'light|sunlight', [['luz', 'luz|luzes|solar']], {
  group: 'stats',
  sense: 'light = illumination (bright light, dim light)',
  text: true,
  ok: (b, a) => !/^\s+(?:armor|weapons?|crossbow|hammer|load|shield)/i.test(a),
  cls: 'contextual',
});
T('condition (game term)', 'conditions?', [['condição', 'condi[çc](?:ão|ões)'], ['estado', 'estados?'], ['requisito', 'requisitos?']], {
  group: 'conditions',
  sense: 'condition = blinded/charmed/... (and ordinary "condition")',
  text: true,
  cls: 'contextual',
});
T('charge (item charges)', 'charges?', [['carga', 'cargas?']], { group: 'stats', sense: 'magic item charge', text: true });
T('proficient (adjective)', 'proficient', [['proficiente', 'proficientes?'], ['treinado', 'treinad\\p{L}*']], { group: 'rolls', sense: 'proficient in a skill/save/tool' });
T('component: verbal / somatic / material', 'Verbal|Somatic|Material', [['Verbal/Somático/Material', 'verbais|verbal|som[áa]tic\\p{L}*|materiais|material']], { group: 'magic', sense: 'spell component names', cs: true, only: ['ui', 'r51'] });

// ----- the six abilities -----
const ABIL = [['Strength', 'for[çc]a'], ['Dexterity', 'destreza'], ['Constitution', 'constitui[çc][ãa]o'], ['Intelligence', 'intelig[êe]ncia'], ['Wisdom', 'sabedoria'], ['Charisma', 'carisma']];
for (const [en, pt] of ABIL) T(en, en, [[pt.replace('[çc]', 'ç').replace('[ãa]', 'ã').replace('[êe]', 'ê'), pt]], { group: 'abilities', sense: 'ability score name' });
T('Strength / Dexterity / ... abbreviations (UI)', 'STR|DEX|CON|INT|WIS|CHA', [['FOR/DES/CON/INT/SAB/CAR', 'FOR|DES|CON|INT|SAB|CAR']], { group: 'abilities', sense: 'ability abbreviations', cs: true, only: ['ui'], note: 'UI keys attributes.abbreviations; en strings are the same three letters' });

// ----- the 18 skills (case-sensitive: capitalised names) -----
const SKILLS = [
  ['Acrobatics', 'acrobacia'], ['Animal Handling', 'adestrar animais'], ['Arcana', 'arcanismo'], ['Athletics', 'atletismo'],
  ['Deception', 'engana[çc][ãa]o'], ['History', 'hist[óo]ria'], ['Insight', 'intui[çc][ãa]o'], ['Intimidation', 'intimida[çc][ãa]o'],
  ['Investigation', 'investiga[çc][ãa]o'], ['Medicine', 'medicina'], ['Nature', 'natureza'], ['Perception', 'percep[çc][ãa]o'],
  ['Performance', 'atua[çc][ãa]o'], ['Persuasion', 'persuas[ãa]o'], ['Religion', 'religi[ãa]o'], ['Sleight of Hand', 'prestidigita[çc][ãa]o'],
  ['Stealth', 'furtividade'], ['Survival', 'sobreviv[êe]ncia'],
];
const SKILL_ALT = {
  'Animal Handling': [['lidar com animais', 'lidar com animais'], ['trato com animais', 'trato com animais']],
  Performance: [['desempenho', 'desempenho'], ['atuação', 'atua[çc][ãa]o'], ['performance', 'performance']],
  Insight: [['intuição', 'intui[çc][ãa]o'], ['percepção (outro)', 'percep[çc][ãa]o']],
  Stealth: [['furtividade', 'furtividade'], ['furtivo', 'furtiv\\p{L}*']],
  Nature: [['natureza', 'natureza'], ['natural (Nature\'s Ward: Proteção Natural)', 'naturai?s?|natural']],
  Arcana: [['arcanismo', 'arcanismo'], ['arcano', 'arcan\\p{L}*']],
  Deception: [['enganação', 'engana[çc][ãa]o'], ['blefe', 'blef\\p{L}*']],
  Medicine: [['medicina', 'medicina'], ['remédio', 'rem[ée]dio']],
};
for (const [en, pt] of SKILLS) {
  const label = pt.replace('[çc]', 'ç').replace('[ãa]', 'ã').replace('[óo]', 'ó').replace('[êe]', 'ê');
  const forms = SKILL_ALT[en] ? [[label, pt], ...SKILL_ALT[en].filter(([l]) => l !== label)] : [[label, pt]];
  T(en, en, forms, {
    group: 'skills',
    sense: 'skill name',
    cs: true,
    ok: (b) => !/[.!?]\s+$/.test(b),
    note: en === 'Nature' || en === 'History' || en === 'Insight' || en === 'Performance' || en === 'Investigation' || en === 'Arcana' ? 'English word also has a common meaning; counted only in skill-name position' : undefined,
  });
}

// ----- conditions (name fields included: conditions.json names are in pt) -----
const COND = [
  ['blinded', [['cego', 'ceg[oa]s?'], ['cegueira', 'cegueira']]],
  ['charmed', [['enfeitiçado', 'enfeiti[çc]\\p{L}*'], ['encantado', 'encantad\\p{L}*']]],
  ['deafened', [['surdo', 'surd[oa]s?'], ['surdez', 'surdez']]],
  ['exhaustion', [['exaustão', 'exaust\\p{L}*'], ['fadiga', 'fadiga']]],
  ['frightened', [['amedrontado', 'amedront\\p{L}*'], ['assustado', 'assustad\\p{L}*'], ['apavorado', 'apavorad\\p{L}*']]],
  ['grappled', [['agarrado', 'agarr\\p{L}*'], ['imobilizado', 'imobilizad\\p{L}*']]],
  ['incapacitated', [['incapacitado', 'incapacit\\p{L}*']]],
  ['invisible', [['invisível', 'invis[íi]ve(?:l|is)']]],
  ['paralyzed', [['paralisado', 'paralis\\p{L}*']]],
  ['petrified', [['petrificado', 'petrific\\p{L}*'], ['em pedra', 'em pedra']]],
  ['poisoned', [['envenenado', 'envenen\\p{L}*']]],
  ['prone', [['caído', 'ca[íi]d[oa]s?'], ['cair (fall prone)', 'ca(?:ir|i|iu|irá|ia|em)'], ['deitado', 'deitad\\p{L}*'], ['prostrado', 'prostrad\\p{L}*']]],
  ['restrained', [['contido', 'cont[ií]d[oa]s?|conter|contêm|contém'], ['impedido', 'impedid\\p{L}*'], ['preso', 'pres[oa]s?'], ['restringido', 'restringid\\p{L}*']]],
  ['stunned', [['atordoado', 'atordo\\p{L}*']]],
  ['unconscious', [['inconsciente', 'inconscientes?']]],
];
for (const [en, forms] of COND) T(en, en, forms, { group: 'conditions', sense: 'condition', note: 'forms are gendered: see inflections' });

// ----- damage types: "<type> damage", resistance lists, {@damage} display, and the standalone UI label ("Fire") -----
// Ambiguous words (fire, cold, force, poison...) only count when "damage" follows ("fire damage",
// "fire, cold, or lightning damage") or the whole string is the label; other uses are separate senses below.
const dmgCtx = (b, a, m, en) =>
  en.trim().toLowerCase() === m.toLowerCase() ||
  /^\s*(?:(?:,|or|and)\s*)*(?:[a-z]+\s*(?:,|or|and)\s*)*damage\b/i.test(a);
// Each form also accepts the whole-string UI label (^Frio$) so the UI is measured in the same row.
const DMG = [
  ['acid', [['ácido', '[áa]cid[oa]s?|^[áa]cido$']]],
  ['bludgeoning', [['contundente', 'contundentes?'], ['contusão', '^contus[ãa]o$|contus[ãa]o']]],
  ['cold', [['gélido', 'g[ée]lid[oa]s?'], ['frio', 'fri[oa]s?'], ['gelado', 'gelad[oa]s?']]],
  ['fire', [['ígneo', '[íi]gne[oa]s?'], ['fogo', 'dano(?:s)? (?:de )?fogo|^fogo$']]],
  ['force', [['energético', 'energ[ée]tic[oa]s?'], ['força', 'dano(?:s)? (?:de )?for[çc]a|^for[çc]a$']]],
  ['lightning', [['elétrico', 'el[ée]tric[oa]s?'], ['relâmpago', 'rel[âa]mpago\\p{L}*']]],
  ['necrotic', [['necrótico', 'necr[óo]tic[oa]s?']]],
  ['piercing', [['perfurante', 'perfurantes?'], ['perfuração', '^perfura[çc][ãa]o$|perfura[çc][ãa]o']]],
  ['poison', [['venenoso', 'venenos[oa]s?'], ['veneno', 'dano(?:s)? (?:de )?veneno|^veneno$']]],
  ['psychic', [['psíquico', 'ps[íi]quic[oa]s?']]],
  ['radiant', [['radiante', 'radiantes?']]],
  ['slashing', [['cortante', 'cortantes?']]],
  ['thunder', [['trovejante', 'trovejantes?'], ['trovão', 'dano(?:s)? (?:de )?trov[ãa]o|^trov[ãa]o$']]],
];
for (const [en, forms] of DMG) {
  const loose = ['bludgeoning', 'piercing', 'slashing', 'necrotic', 'radiant', 'psychic'].includes(en);
  T(`${en} (damage type)`, en, forms, { group: 'damage', sense: 'damage type (rules text and UI labels)', text: true, ok: loose ? undefined : dmgCtx, note: 'UI labels in messages/pt.json spellsData.damageTypes' });
}


// Same English words, not damage: fire (flames), cold (temperature), force (power / verb), poison (substance).
const notDmg = (b, a, m, en) => !dmgCtx(b, a, m, en);
T('fire (noun: flames / element)', 'fire', [['fogo', 'fogo'], ['chama', 'chamas?'], ['ígneo', '[íi]gne[oa]s?']], { group: 'damage', sense: 'fire as flames or the element, not damage', text: true, ok: notDmg, cls: 'contextual' });
T('poison (noun: substance)', 'poison(?:s|ed)?', [['veneno', 'venenos?'], ['envenenar', 'envenen\\p{L}*'], ['venenoso', 'venenos[oa]s?']], { group: 'damage', sense: 'poison as a substance / to poison, not damage', text: true, ok: notDmg, cls: 'contextual' });
T('cold (adjective / noun)', 'cold', [['frio', 'fri[oa]s?'], ['gélido', 'g[ée]lid[oa]s?']], { group: 'damage', sense: 'cold as temperature, not damage', text: true, ok: notDmg, cls: 'contextual' });
T('force (noun / verb)', 'force(?:s|d)?', [['força', 'for[çc]a'], ['forçar', 'for[çc]ar|for[çc]ad\\p{L}*'], ['energia', 'energia'], ['obrigar', 'obrig\\p{L}*']], { group: 'damage', sense: 'force as power or to force, not force damage', text: true, ok: notDmg, cls: 'contextual' });

// ----- creature types -----
const CT = [
  ['aberration', [['aberração', 'aberra[çc](?:ão|ões)']]],
  ['beast', [['fera', 'feras?'], ['animal', 'animais|animal'], ['besta', 'bestas?']]],
  ['celestial', [['celestial', 'celestiais|celestial']]],
  ['construct', [['constructo', 'constructos?'], ['constructo/construto', 'construtos?']]],
  ['dragon', [['dragão', 'drag(?:ão|ões)']]],
  ['elemental', [['elemental', 'elementais|elemental']]],
  ['fey', [['feérico', 'fe[ée]ric[oa]s?'], ['fada', 'fadas?']]],
  ['fiend', [['ínfero', '[íi]nfer[oa]s?'], ['demônio', 'dem[ôo]nios?']]],
  ['giant', [['gigante', 'gigantes?']]],
  ['humanoid', [['humanoide', 'humanoides?']]],
  ['monstrosity', [['monstruosidade', 'monstruosidades?']]],
  ['ooze', [['gosma', 'gosmas?'], ['limo', 'limos?']]],
  ['plant', [['planta', 'plantas?']]],
  ['undead', [['morto-vivo', 'mort[oa]s?-viv[oa]s?']]],
];
for (const [en, forms] of CT) T(`${en} (creature type)`, `${en}(?:s|es)?`, forms, { group: 'creature-types', sense: 'creature type', text: true, ok: en === 'beast' ? (b, a) => !/^\s+shape/i.test(a) : undefined, note: ['beast', 'dragon', 'giant', 'plant', 'elemental', 'celestial'].includes(en) ? 'also ordinary word / spell names; counted in text fields only' : undefined });
T('beast shape (Wild Shape)', 'beast shape', [['forma animal', 'forma animal'], ['forma de fera', 'forma de fera'], ['Forma Selvagem', 'forma selvagem']], { group: 'features', sense: 'beast shape (druid)', text: true });

// ----- sizes (case-sensitive; capitalised) -----
const SIZES = [
  ['Tiny', [['minúsculo', 'min[úu]scul[oa]s?'], ['mínimo', 'm[íi]nim[oa]s?'], ['diminuto', 'diminut[oa]s?']]],
  ['Small', [['pequeno', 'pequen[oa]s?']]],
  ['Medium', [['médio', 'm[ée]di[oa]s?']]],
  ['Large', [['grande', 'grandes?']]],
  ['Huge', [['enorme', 'enormes?']]],
  ['Gargantuan', [['imenso', 'imens[oa]s?'], ['colossal', 'colossais|colossal'], ['gigantesco', 'gigantesc[oa]s?']]],
];
for (const [en, forms] of SIZES) T(`${en} (size)`, en, forms, { group: 'sizes', sense: 'creature size category', cs: true, text: true, ok: (b, a) => /(?:^|\s)(?:a|an|the|or|of|is|be|than)\s$/i.test(b) && /^\s*(?:or|size|creature|humanoid|beast|object|target|\)|,|\.)/i.test(a) || /^\s*(?:or (?:smaller|larger)|size|creature)/i.test(a) });

// ----- schools of magic -----
const SCH = [['Abjuration', 'abjura[çc][ãa]o'], ['Conjuration', 'conjura[çc][ãa]o'], ['Divination', 'adivinha[çc][ãa]o'], ['Enchantment', 'encantamento'], ['Evocation', 'evoca[çc][ãa]o'], ['Illusion', 'ilus[ãa]o'], ['Necromancy', 'necromancia'], ['Transmutation', 'transmuta[çc][ãa]o']];
for (const [en, pt] of SCH) T(`${en} (school)`, en, [[pt.replace('[çc]', 'ç').replace('[ãa]', 'ã'), pt]], { group: 'schools', sense: 'school of magic', text: true });

// ----- classes -----
const CLS = [
  ['Barbarian', [['bárbaro', 'b[áa]rbar\\p{L}*']]], ['Bard', [['bardo', 'bard[oa]s?']]], ['Cleric', [['clérigo', 'cl[ée]rig\\p{L}*']]],
  ['Druid', [['druida', 'druidas?']]], ['Fighter', [['guerreiro', 'guerreir\\p{L}*']]], ['Monk', [['monge', 'monges?']]],
  ['Paladin', [['paladino', 'paladin\\p{L}*']]], ['Ranger', [['patrulheiro', 'patrulheir\\p{L}*'], ['ranger', 'rangers?']]],
  ['Rogue', [['ladino', 'ladin\\p{L}*'], ['ladrão', 'ladr[ãa]o|ladr[õo]es']]],
  ['Sorcerer', [['feiticeiro', 'feiticeir\\p{L}*']]], ['Warlock', [['bruxo', 'bruxo\\p{L}*|bruxa\\p{L}*']]], ['Wizard', [['mago', 'mag[oa]s?']]],
];
for (const [en, forms] of CLS) T(`${en} (class)`, en, forms, { group: 'classes', sense: 'class name', note: en === 'Ranger' || en === 'Monk' || en === 'Fighter' ? 'also an ordinary word; see none examples' : undefined });

// ----- coins -----
T('gp', '\\d[\\d,.]*\\s?gp', [['po', '\\d[\\d,.]*\\s?po'], ['gp', '\\d[\\d,.]*\\s?gp'], ['peças de ouro', 'peças? de ouro']], { group: 'coins', sense: 'gold piece' });
T('sp', '\\d[\\d,.]*\\s?sp', [['pp', '\\d[\\d,.]*\\s?pp'], ['sp', '\\d[\\d,.]*\\s?sp'], ['peças de prata', 'peças? de prata']], { group: 'coins', sense: 'silver piece (pp in pt would clash with platinum)' });
T('cp', '\\d[\\d,.]*\\s?cp', [['pc', '\\d[\\d,.]*\\s?pc'], ['cp', '\\d[\\d,.]*\\s?cp'], ['peças de cobre', 'peças? de cobre']], { group: 'coins', sense: 'copper piece' });
T('ep', '\\d[\\d,.]*\\s?ep', [['pe', '\\d[\\d,.]*\\s?pe'], ['ep', '\\d[\\d,.]*\\s?ep']], { group: 'coins', sense: 'electrum piece' });
T('pp', '\\d[\\d,.]*\\s?pp', [['pl', '\\d[\\d,.]*\\s?pl'], ['pp', '\\d[\\d,.]*\\s?pp'], ['platina', 'platina']], { group: 'coins', sense: 'platinum piece' });
T('platinum / gold / silver / copper (word)', 'platinum|gold pieces?|silver pieces?|copper pieces?|electrum', [['platina/ouro/prata/cobre', 'platina|ouro|prata|cobre|electro|eletro']], { group: 'coins', sense: 'coin names in words', text: true });

// ---------- measure ----------
const measure = (term) => {
  const enRe = W(term.re, term.cs ? 'u' : 'iu');
  const forms = term.forms.map(([label, src]) => ({
    label,
    re: W(src, 'iu'),
    count: 0,
    variants: new Map(),
    bySrc: Object.fromEntries(SRC_IDS.map((s) => [s, 0])),
  }));
  const total = { all: 0, ...Object.fromEntries(SRC_IDS.map((s) => [s, 0])) };
  const none = [];
  const rows = []; // per matching string: which forms are present (used for "exclusive" counts)
  for (const o of corpus) {
    if (term.text && isName(o)) continue;
    if (term.only && !term.only.includes(o.src)) continue;
    let hit = false;
    for (const m of o.en.matchAll(enRe)) {
      const before = o.en.slice(Math.max(0, m.index - 50), m.index);
      const after = o.en.slice(m.index + m[0].length, m.index + m[0].length + 60);
      if (term.ok && !term.ok(before, after, m[0], o.en, o)) continue;
      hit = true;
      break;
    }
    if (!hit) continue;
    total.all++;
    total[o.src]++;
    let any = false;
    const present = new Set();
    rows.push({ key: o.key, src: o.src, present });
    for (const f of forms) {
      const found = [...o.pt.matchAll(f.re)];
      if (!found.length) continue;
      any = true;
      present.add(f.label);
      f.count++;
      f.bySrc[o.src]++;
      for (const m of found) f.variants.set(m[0].toLowerCase(), (f.variants.get(m[0].toLowerCase()) ?? 0) + 1);
    }
    if (!any) none.push(o.key);
  }
  return { term, forms, total, none, rows };
};

// Two sources (5.1 rules, 5.2 rules, UI) whose winning forms do not overlap: the approved pt disagrees with itself
// even if one source has a single string.
const winners = (r, src) => {
  const counts = r.forms.map((f) => [f.label, f.bySrc[src]]);
  const max = Math.max(0, ...counts.map(([, c]) => c));
  return max ? new Set(counts.filter(([, c]) => c === max).map(([l]) => l)) : null;
};
const sourcesDisagree = (r) => {
  const sets = SRC_IDS.map((s) => winners(r, s)).filter(Boolean);
  return sets.some((x, i) => sets.some((y, j) => j > i && ![...x].some((l) => y.has(l))));
};
const classify = (r) => {
  const { term, forms, total } = r;
  const sorted = [...forms].sort((a, b) => b.count - a.count);
  const top = sorted[0];
  // A rival form only counts where the dominant form is absent: a string that has both is usually the
  // rival word showing up for another reason ("turno" inside a sentence about "round").
  for (const f of forms) f.excl = top && f !== top ? r.rows.filter((x) => x.present.has(f.label) && !x.present.has(top.label)).length : 0;
  const second = [...sorted.slice(1)].sort((a, b) => b.excl - a.excl)[0];
  let cls;
  if (total.all === 0) cls = 'no-evidence';
  else if (!top || top.count === 0) cls = 'no-evidence';
  else if (term.cls) cls = term.cls;
  else if (top.count / total.all >= UNCONDITIONAL_SHARE) cls = 'unconditional';
  else if (second && second.excl >= 2 && second.excl / total.all >= COMPETITOR_SHARE) cls = 'inconsistent';
  else if (sourcesDisagree(r)) cls = 'inconsistent';
  else cls = 'unconfirmed'; // dominant form below 95% and no competing form: the pt omits or rephrases the term in the rest
  return { cls, top, sorted };
};

// Manual class decisions made after reading the examples (see the md). Each one has a reason.
const OVERRIDE = {
  'spell level in the UI (Circle / slots by level)': ['inconsistent', 'UI uses "nível" (8 of 8 strings, 0 "círculo") while 5.1 rules use "círculo" (see the spell level row above); the UI choice is recorded as an owner decision in fase-1-resultados.md'],
  heal: ['contextual', 'healing (noun) = "cura"; heal (verb) = "curar"; regained hit points = "recuperar"'],
  'duration (noun, other uses)': ['contextual', 'clause "for the spell\'s duration" = "enquanto a magia durar"; noun "the duration of" = "a duração"'],
  'saving throw': ['inconsistent', 'minority "teste de resistência" / "teste de salvaguarda": 5.1 class text (druid, fighter, monk...) and one UI string; spells use "salvaguarda"'],
  'turn (noun)': ['inconsistent', 'rules use "turno"; six UI combat labels use "vez" ("Sua vez", "Vez atual")'],
  'ability check': ['inconsistent', '"teste de atributo" with a minority "teste de habilidade"'],
  'roll (verb)': ['inconsistent', '"jogar/jogue" in 5.1 rules vs "rolar/role" in the UI and some rules'],
  'hit (verb: "if you hit a creature")': ['inconsistent', '"atingir" vs "acertar" for the same verb'],
  miss: ['inconsistent', '"falhar" vs "errar" vs "erro"'],
  DM: ['inconsistent', 'DM kept in 5.1 pt but "Mestre" appears too'],
  'unarmed strike': ['inconsistent', '"golpe desarmado" vs "ataque desarmado"'],
  'weapon attack': ['inconsistent', '"ataque armado" vs "ataque com arma"'],
  Nature: ['contextual', 'skill = "natureza"; "Nature\'s Ward/Sanctuary" (druid feature names) = "Natural"'],
  speed: ['contextual', 'creature speed = "deslocamento"; wind speed = "velocidade"'],
  prone: ['contextual', 'be prone = "caído"; fall prone = verb "cair"'],
  'beast (creature type)': ['contextual', 'creature type = "fera"; "beast shape" and druid text use "animal"'],
};
const results = TERMS.map((t) => {
  const r = measure(t);
  const c = classify(r);
  const ov = OVERRIDE[t.en];
  if (ov && c.cls !== 'no-evidence') {
    c.cls = ov[0];
    c.overrideReason = ov[1];
  }
  return { ...r, ...c };
});

// ---------- output ----------
const pct = (n, d) => (d ? `${Math.round((100 * n) / d)}%` : '-');
const topVariants = (f, n = 6) => (f ? [...f.variants].sort((a, b) => b[1] - a[1]).slice(0, n).map(([v]) => v) : []);
const srcBreak = (r) =>
  SRC_IDS.map((s) => `${SRC_LABEL[s]}[n=${r.total[s]}: ${r.forms.filter((f) => f.bySrc[s]).map((f) => `${f.label} ${f.bySrc[s]}`).join(', ') || '-'}]`).join(' ');

// --none 'termRegex' [--ptctx 'regex'] [--n 6]: show strings where the English term is present but no candidate matched
// --alone 'termRegex' --form 'label': strings where that rival form appears without the dominant form
if (flag('alone')) {
  const byKey = new Map(corpus.map((o) => [o.key, o]));
  for (const r of results.filter((x) => new RegExp(opt('alone'), 'i').test(x.term.en))) {
    const top = r.sorted[0].label;
    const rows = r.rows.filter((x) => x.present.has(opt('form')) && !x.present.has(top));
    console.log(`## ${r.term.en}: ${rows.length} strings with "${opt('form')}" and without "${top}"`);
    const enRe = W(r.term.re, r.term.cs ? 'u' : 'iu');
    const f = r.forms.find((x) => x.label === opt('form'));
    for (const row of rows.slice(0, Number(opt('n', 6)))) {
      const o = byKey.get(row.key);
      const m = enRe.exec(o.en);
      enRe.lastIndex = 0;
      const pm = new RegExp(f.re.source, 'iu').exec(o.pt);
      const cut = (str, i, len) => str.slice(Math.max(0, i - 60), i + len + 60).replace(/\s+/g, ' ');
      console.log(`[${row.key}]\n  EN: ...${m ? cut(o.en, m.index, m[0].length) : ''}...\n  PT: ...${pm ? cut(o.pt, pm.index, pm[0].length) : ''}...`);
    }
  }
  process.exit(0);
}

if (flag('none')) {
  const byKey = new Map(corpus.map((o) => [o.key, o]));
  for (const r of results.filter((x) => new RegExp(opt('none'), 'i').test(x.term.en))) {
    console.log(`## ${r.term.en}: ${r.none.length} strings without any candidate`);
    const enRe = W(r.term.re, r.term.cs ? 'u' : 'iu');
    for (const key of r.none.slice(0, Number(opt('n', 6)))) {
      const o = byKey.get(key);
      const m = enRe.exec(o.en);
      enRe.lastIndex = 0;
      const pm = opt('ptctx') ? new RegExp(opt('ptctx'), 'i').exec(o.pt) : null;
      const cut = (str, i, len) => str.slice(Math.max(0, i - 70), i + len + 70).replace(/\s+/g, ' ');
      console.log(`[${key}]\n  EN: ...${m ? cut(o.en, m.index, m[0].length) : o.en.slice(0, 120)}...\n  PT: ${pm ? `...${cut(o.pt, pm.index, pm[0].length)}...` : o.pt.replace(/\s+/g, ' ').slice(0, 200)}`);
    }
  }
  process.exit(0);
}

// --examples: for every contextual/inconsistent row, up to 2 real pairs (en context, pt context around the dominant form)
if (flag('examples')) {
  const byKey = new Map(corpus.map((o) => [o.key, o]));
  const cut = (str, i, len) => str.slice(Math.max(0, i - 55), i + len + 55).replace(/\s+/g, ' ');
  for (const r of results.filter((x) => ['contextual', 'inconsistent'].includes(x.cls))) {
    console.log(`## [${r.cls}] ${r.term.en} — ${r.term.sense}`);
    const enRe = W(r.term.re, r.term.cs ? 'u' : 'iu');
    const picks = [];
    for (const f of r.sorted.slice(0, 3)) {
      const row = r.rows.find((x) => x.present.has(f.label) && (f === r.sorted[0] || !x.present.has(r.sorted[0].label))) ?? r.rows.find((x) => x.present.has(f.label));
      if (row && !picks.includes(row)) picks.push([f, row]);
    }
    for (const [f, row] of picks.slice(0, 3)) {
      const o = byKey.get(row.key);
      const m = enRe.exec(o.en);
      enRe.lastIndex = 0;
      const pm = new RegExp(f.re.source, 'iu').exec(o.pt);
      console.log(`  (${f.label}) [${row.key}]\n    EN: ...${m ? cut(o.en, m.index, m[0].length) : ''}...\n    PT: ...${pm ? cut(o.pt, pm.index, pm[0].length) : ''}...`);
    }
  }
  process.exit(0);
}

// --check33: run the 33 provisional entries of poc2-bench.mjs (GLOSSARY) over the whole corpus
if (flag('check33')) {
  const bench = readFileSync(path.join(ROOT, 'docs/discovery/localization-infrastructure/scripts/poc2-bench.mjs'), 'utf8');
  const block = bench.slice(bench.indexOf('const GLOSSARY = ['), bench.indexOf('const termsFor'));
  const GLOSSARY = new Function(block.replace('const GLOSSARY =', 'return'))();
  for (const [re, pt, ptRe] of GLOSSARY) {
    const by = { r51: [0, 0], r52: [0, 0], ui: [0, 0] };
    const miss = [];
    let n = 0;
    let ok = 0;
    for (const o of corpus) {
      if (!re.test(o.en)) continue;
      n++;
      by[o.src][0]++;
      if (ptRe.test(o.pt)) {
        ok++;
        by[o.src][1]++;
      } else miss.push(o.key);
    }
    console.log(`${String(re).padEnd(32)} ${pt.padEnd(15)} en=${n} pt-ok=${ok} (${pct(ok, n)}) 5.1 ${by.r51.join('/')} 5.2 ${by.r52.join('/')} UI ${by.ui.join('/')}${miss.length ? `  miss e.g. ${miss.slice(0, 2).join(', ')}` : ''}`);
  }
  process.exit(0);
}

if (flag('json')) {
  console.log(JSON.stringify(results.map((r) => ({ en: r.term.en, sense: r.term.sense, cls: r.cls, total: r.total, forms: r.forms.map((f) => ({ label: f.label, count: f.count, bySrc: f.bySrc, variants: topVariants(f, 8) })), none: r.none.slice(0, 5) })), null, 1));
  process.exit(0);
}

console.log(`corpus: ${corpus.length} aligned string pairs (${SRC_IDS.map((s) => `${SRC_LABEL[s]}=${corpus.filter((o) => o.src === s).length}`).join(', ')})\n`);
const only = opt('only');
for (const r of results) {
  if (only && !new RegExp(only, 'i').test(`${r.term.en} ${r.term.group}`)) continue;
  console.log(
    `[${r.cls}] ${r.term.en} — ${r.term.sense}  (n=${r.total.all})\n    ${r.sorted.map((f) => `${f.label}: ${f.count} (${pct(f.count, r.total.all)}${f.excl ? `, alone ${f.excl}` : ''})`).join(' | ')}  | none: ${r.none.length}\n    ${srcBreak(r)}\n    variants: ${r.sorted.slice(0, 2).map((f) => topVariants(f, 5).join('/')).join(' || ')}${r.none.length ? `\n    none e.g.: ${r.none.slice(0, 2).join(', ')}` : ''}`,
  );
}
const counts = {};
for (const r of results) counts[r.cls] = (counts[r.cls] ?? 0) + 1;
console.log('\nrows per class:', counts, 'of', results.length);

// ---------- CSV ----------
if (flag('csv')) {
  const q = (v) => `"${String(v ?? '').replaceAll('"', '""')}"`;
  const lines = ['en,pt,inflections,class,sense,evidence_count,total_count,note'];
  for (const r of results) {
    const { cls, sorted, top } = r;
    let pt;
    let infl;
    let evidence;
    if (cls === 'no-evidence') {
      pt = 'no-evidence';
      infl = '';
      evidence = 0;
    } else if (cls === 'inconsistent') {
      const rivals = [top, ...sorted.filter((f) => f !== top && f.excl >= 2 && f.excl / r.total.all >= COMPETITOR_SHARE)];
      pt = rivals.map((f) => f.label).join(' | ');
      infl = rivals.map((f) => topVariants(f, 3).join('/')).join(' | ');
      evidence = top.count;
    } else {
      pt = top.label;
      infl = topVariants(top, 6).join('/');
      evidence = top.count;
    }
    const note = [
      r.term.note,
      cls === 'inconsistent' || cls === 'contextual' ? srcBreak(r) : '',
      r.none.length ? `none ${r.none.length}: ${r.none.slice(0, 2).join(', ')}` : '',
      r.overrideReason ? `manual: ${r.overrideReason}` : '',
      cls === 'inconsistent' ? 'owner decision needed' : '',
      cls === 'unconfirmed' ? 'below 95% with no rival form: see none examples' : '',
      r.total.all > 0 && r.total.all < 5 ? 'low n' : '',
    ].filter(Boolean).join(' ; ');
    lines.push([q(r.term.en), q(pt), q(infl), q(cls), q(r.term.sense), evidence, r.total.all, q(note)].join(','));
  }
  writeFileSync(OUT_CSV, `${lines.join('\n')}\n`);
  console.log(`wrote ${OUT_CSV} (${lines.length - 1} rows)`);
}

// ---------- edition drift: same key, different approved pt name in 5.1 and 5.2 ----------
if (flag('editions')) {
  const pairs = new Map();
  for (const o of corpus) {
    if (o.src === 'ui' || !isName(o)) continue;
    const k = `${o.file}/${o.key.split('/').slice(2).join('/')}`;
    const row = pairs.get(k) ?? {};
    row[o.src] = { en: o.en, pt: o.pt };
    pairs.set(k, row);
  }
  const both = [...pairs].filter(([, v]) => v.r51 && v.r52);
  const diff = both.filter(([, v]) => v.r51.pt.trim().toLowerCase() !== v.r52.pt.trim().toLowerCase());
  console.log(`\nedition drift: ${both.length} name keys present in both 5.1 and 5.2 pt, ${diff.length} with a different pt`);
  for (const [k, v] of diff.slice(0, Number(opt('n', 40)))) console.log(`  ${k}: en "${v.r51.en}" | 5.1 "${v.r51.pt}" | 5.2 "${v.r52.pt}"`);
}

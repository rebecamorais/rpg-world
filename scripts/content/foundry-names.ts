/**
 * English name → translated name, read from the Foundry VTT translation modules (Babele format).
 * See import-foundry-class-names.ts.
 */

/** The `entries` of a Babele file: keyed by English name (pt-BR) or by Foundry id (es). */
export type BabeleEntries = Record<string, { name?: string }>;

export type NameIndex = {
  /**
   * The translation of `enName`. `context` holds the English names of where it sits (subclass,
   * then class): Babele keeps same-name features apart as "Expertise (Bard)", tried first.
   */
  get(enName: string, context: string[]): string | undefined;
  /** English names with two different translations in the source: left untranslated. */
  ambiguous: Set<string>;
};

const ENTITIES: Record<string, string> = { amp: '&', quot: '"', apos: "'", lt: '<', gt: '>' };

const decode = (value: string) =>
  value.replace(/&(#\d+|[a-z]+);/gi, (match, code: string) =>
    code.startsWith('#') ? String.fromCodePoint(Number(code.slice(1))) : (ENTITIES[code] ?? match),
  );

/** The translated name, trimmed and decoded; `undefined` when empty or still in English. */
export function cleanName(value: string | undefined, enName: string): string | undefined {
  const name = decode(value ?? '').trim();
  return name && name !== enName ? name : undefined;
}

function indexOf(pairs: [enName: string, translated: string | undefined][]): NameIndex {
  const names = new Map<string, string>();
  const ambiguous = new Set<string>();
  for (const [enName, value] of pairs) {
    const name = cleanName(value, enName);
    if (!name) continue;
    const known = names.get(enName);
    if (known !== undefined && known !== name) ambiguous.add(enName);
    else names.set(enName, name);
  }
  const lookup = (enName: string) => (ambiguous.has(enName) ? undefined : names.get(enName));
  return {
    get: (enName, context) =>
      context.map((c) => lookup(`${enName} (${c})`)).find(Boolean) ?? lookup(enName),
    ambiguous,
  };
}

/** Foundry VTT Brasil: entries keyed by English name. */
export const ptNameIndex = (files: BabeleEntries[]): NameIndex =>
  indexOf(
    files.flatMap((entries) =>
      Object.entries(entries).map(([en, e]): [string, string | undefined] => [en, e.name]),
    ),
  );

/** sinregistrar: entries keyed by Foundry id, named in English by the dnd5e system's packs. */
export const esNameIndex = (entries: BabeleEntries, enNameById: Map<string, string>): NameIndex =>
  indexOf(
    Object.entries(entries).flatMap(([id, e]) => {
      const en = enNameById.get(id);
      return en ? [[en, e.name] as [string, string | undefined]] : [];
    }),
  );

/**
 * Where the Foundry translations are read from, each pinned to a commit (see NOTICE.md).
 *
 * - pt-BR: Foundry VTT Brasil (https://gitlab.com/fvtt-brasil/dnd5e), SRD 5.1, keyed by English name.
 * - pt-BR: decito/dnd5e-pt-br, its successor, SRD 5.2, keyed by Foundry id.
 * - es: foundryvtt-sinregistrar/translate-dnd5e-sdr2-es, SRD 5.2.1, keyed by Foundry id.
 * - foundryvtt/dnd5e: only to name those ids in English (packs/_source/classes24).
 */
import { parse } from 'yaml';

import type { BabeleEntries } from './foundry-names';

const PT_COMMIT = '0c813e5b2cb22bb4de46a1c69c87c6c89b954f3c';
const PT24_COMMIT = 'fc2fb348d5d46a49944ab2675b865627e06f06f6';
const ES_COMMIT = '1c0f60911e7167b40ea58192a51e1c9ca64c31f3';
const DND5E_COMMIT = '81af804b22c02c3faa5ddf66db0051dfd768d5fb';

// GitLab answers 403 to scripts on its /-/raw/ links: read through the API (project 17061837)
const ptFile = (file: string) =>
  `https://gitlab.com/api/v4/projects/17061837/repository/files/${encodeURIComponent(`dnd5e_pt-BR/lang/pt-BR/compendium/${file}`)}/raw?ref=${PT_COMMIT}`;
const PT24_BASE = `https://raw.githubusercontent.com/decito/dnd5e-pt-br/${PT24_COMMIT}/compendium`;
const ES_BASE = `https://raw.githubusercontent.com/foundryvtt-sinregistrar/translate-dnd5e-sdr2-es/${ES_COMMIT}/compendium`;
const DND5E_RAW = `https://raw.githubusercontent.com/foundryvtt/dnd5e/${DND5E_COMMIT}`;
const DND5E_API = 'https://api.github.com/repos/foundryvtt/dnd5e';
const CLASSES_DIR = 'packs/_source/classes24';

/** Hundreds of small downloads: a dropped connection is retried twice before giving up. */
async function get(url: string, headers: Record<string, string> = {}): Promise<Response> {
  let response: Response | undefined;
  for (let attempt = 1; !response; attempt++) {
    try {
      response = await fetch(url, { headers });
    } catch (error) {
      if (attempt === 3) throw new Error(`${url}: ${String(error)}`);
    }
  }
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  return response;
}

const entriesOf = async (url: string) =>
  ((await (await get(url)).json()) as { entries: BabeleEntries }).entries;

/** The pt-BR classes, subclasses and class features. */
export const fetchPtCompendia = (): Promise<BabeleEntries[]> =>
  Promise.all(
    ['dnd5e.classes.json', 'dnd5e.subclasses.json', 'dnd5e.classfeatures.json'].map((file) =>
      entriesOf(ptFile(file)),
    ),
  );

/** The pt-BR classes of SRD 5.2 (classes, subclasses and their features in one file). */
export const fetchPtClasses24 = (): Promise<BabeleEntries> =>
  entriesOf(`${PT24_BASE}/dnd5e.classes24.json`);

/** The es classes of SRD 5.2.1 (classes, subclasses and their features in one file). */
export const fetchEsClasses = (): Promise<BabeleEntries> =>
  entriesOf(`${ES_BASE}/dnd5e.classes24.json`);

/** The `_id` and `name` of a Foundry pack document, or `undefined` for anything else. */
export function idNameOf(yamlSource: string): [string, string] | undefined {
  const doc = parse(yamlSource) as { _id?: unknown; name?: unknown } | null;
  return typeof doc?._id === 'string' && typeof doc.name === 'string'
    ? [doc._id, doc.name]
    : undefined;
}

/** Foundry id → English name of every document in the dnd5e system's classes24 pack. */
export async function fetchDnd5eClassNames(): Promise<Map<string, string>> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

  // The whole repository's tree is too big for one call: list the pack's folder, then its tree
  const parent = CLASSES_DIR.split('/').slice(0, -1).join('/');
  const listing = (await (
    await get(`${DND5E_API}/contents/${parent}?ref=${DND5E_COMMIT}`, headers)
  ).json()) as { name: string; sha: string }[];
  const dir = listing.find((entry) => entry.name === CLASSES_DIR.split('/').at(-1));
  if (!dir) throw new Error(`${CLASSES_DIR} not found at ${DND5E_COMMIT}`);
  const tree = (await (
    await get(`${DND5E_API}/git/trees/${dir.sha}?recursive=1`, headers)
  ).json()) as { tree: { path: string; type: string }[]; truncated: boolean };
  if (tree.truncated) throw new Error(`${CLASSES_DIR}: tree truncated`);

  const files = tree.tree.filter((e) => e.type === 'blob' && e.path.endsWith('.yml'));
  const names = new Map<string, string>();
  for (let i = 0; i < files.length; i += 20) {
    const batch = await Promise.all(
      files
        .slice(i, i + 20)
        .map(async (f) => (await get(`${DND5E_RAW}/${CLASSES_DIR}/${f.path}`)).text()),
    );
    for (const source of batch) {
      const pair = idNameOf(source);
      if (pair) names.set(...pair);
    }
  }
  return names;
}

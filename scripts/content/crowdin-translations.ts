/**
 * Sends translations to Crowdin as unapproved suggestions, skipping the strings that already have
 * one there. Crowdin API v2, plain fetch.
 */

type Tree = { [key: string]: unknown };

const isTree = (value: unknown): value is Tree =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

/** The path of every string in a JSON tree, in key order. */
export function leafPaths(json: unknown, prefix: string[] = []): string[][] {
  if (!isTree(json)) return typeof json === 'string' ? [prefix] : [];
  return Object.entries(json).flatMap(([key, value]) => leafPaths(value, [...prefix, key]));
}

/** A copy without the skipped strings and the objects they leave empty. */
export function withoutPaths<T>(
  json: T,
  skip: (path: string[]) => boolean,
  prefix: string[] = [],
): T {
  if (!isTree(json)) return json;
  const kept: Tree = {};
  for (const [key, value] of Object.entries(json)) {
    const path = [...prefix, key];
    if (isTree(value)) {
      const child = withoutPaths(value, skip, path);
      if (Object.keys(child).length) kept[key] = child;
    } else if (!skip(path)) kept[key] = value;
  }
  return kept as T;
}

/** Crowdin's identifier of a string in a nested JSON file. */
export const identifierOf = (path: string[]): string => path.join('.');

/**
 * Throws unless Crowdin's identifiers are the English file's paths as `identifierOf` builds
 * them: a format we don't expect would make the "already on Crowdin" filter skip nothing.
 */
export function assertIdentifiers(crowdinIds: string[], en: unknown, file: string): void {
  const expected = new Set(leafPaths(en).map(identifierOf));
  const unknown = crowdinIds.filter((id) => !expected.has(id));
  if (!crowdinIds.length || unknown.length > crowdinIds.length / 10) {
    throw new Error(
      `${file}: Crowdin identifiers don't match the JSON paths (e.g. ${unknown.slice(0, 3).join(', ')})`,
    );
  }
}

/**
 * How a translated file is imported: as suggestions only. Never approved, never equal to the
 * English, and kept out of the translation memory until someone approves them on Crowdin.
 */
export const translationImport = (storageId: number, fileId: number) => ({
  storageId,
  fileId,
  importEqSuggestions: false,
  autoApproveImported: false,
  addToTm: false,
});

const API = 'https://api.crowdin.com/api/v2';

export class CrowdinClient {
  constructor(
    private readonly projectId: string,
    private readonly token: string,
  ) {}

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API}${path}`, {
      ...init,
      headers: { Authorization: `Bearer ${this.token}`, ...init.headers },
    });
    if (!response.ok) {
      throw new Error(`Crowdin ${path}: HTTP ${response.status} ${await response.text()}`);
    }
    return (await response.json()) as T;
  }

  /** Every item of a paginated list. */
  private async list<T>(path: string): Promise<T[]> {
    const items: T[] = [];
    const sep = path.includes('?') ? '&' : '?';
    for (let offset = 0; ; offset += 500) {
      const page = await this.request<{ data: { data: T }[] }>(
        `${path}${sep}limit=500&offset=${offset}`,
      );
      items.push(...page.data.map((d) => d.data));
      if (page.data.length < 500) return items;
    }
  }

  /** The id of a source file, by its path in the project ("/content/…/en/classes.json"). */
  async fileId(path: string): Promise<number> {
    const files = await this.list<{ id: number; path: string }>(
      `/projects/${this.projectId}/files`,
    );
    const file = files.find((f) => f.path === path);
    if (!file) throw new Error(`Crowdin: no source file ${path}`);
    return file.id;
  }

  /** The project's target language whose two-letter code is `twoLetters`. */
  async languageId(twoLetters: 'pt' | 'es'): Promise<string> {
    const project = await this.request<{
      data: { targetLanguages: { id: string; twoLettersCode: string }[] };
    }>(`/projects/${this.projectId}`);
    const matches = project.data.targetLanguages.filter((l) => l.twoLettersCode === twoLetters);
    if (matches.length !== 1) {
      throw new Error(`Crowdin: ${matches.length} target languages for "${twoLetters}"`);
    }
    return matches[0].id;
  }

  /** The identifiers of every string in a file. */
  async identifiers(fileId: number): Promise<Map<number, string>> {
    const strings = await this.list<{ id: number; identifier: string }>(
      `/projects/${this.projectId}/strings?fileId=${fileId}`,
    );
    return new Map(strings.map((s) => [s.id, s.identifier]));
  }

  /** The identifiers of the strings that already have a translation, approved or not. */
  async translatedIdentifiers(
    fileId: number,
    languageId: string,
    identifiers: Map<number, string>,
  ): Promise<Set<string>> {
    const translations = await this.list<{ stringId: number }>(
      `/projects/${this.projectId}/languages/${languageId}/translations?fileId=${fileId}`,
    );
    return new Set(
      translations.flatMap((t) => {
        const id = identifiers.get(t.stringId);
        return id ? [id] : [];
      }),
    );
  }

  /** Uploads a translated file, never approved and never equal to the English. */
  async uploadTranslation(
    fileId: number,
    languageId: string,
    fileName: string,
    json: unknown,
  ): Promise<void> {
    const storage = await this.request<{ data: { id: number } }>('/storages', {
      method: 'POST',
      headers: { 'Crowdin-API-FileName': fileName, 'Content-Type': 'application/json' },
      body: JSON.stringify(json),
    });
    await this.request(`/projects/${this.projectId}/translations/${languageId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(translationImport(storage.data.id, fileId)),
    });
  }
}

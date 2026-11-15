/**
 * Sends translations to Weblate (hosted.weblate.org, project rpgworldapp) as suggestions: they
 * wait there for someone to accept them, and only accepted ones reach the repository. Weblate
 * skips strings that already have a translation. Weblate API, plain fetch.
 */
import { existsSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import path from 'node:path';

const API = 'https://hosted.weblate.org/api/';
const PROJECT = 'rpgworldapp';

/** The rules component of a book's i18n file: srd-5.2 + classes → srd-5-2-classes. */
export const componentOf = (book: string, file: string): string =>
  `${book.replace('.', '-')}-${file}`;

/** Weblate's code for a locale of the files: `pt` is shown as Brazilian Portuguese. */
export const languageOf = (locale: 'pt' | 'es'): string => (locale === 'pt' ? 'pt_BR' : locale);

/** The API key: WEBLATE_TOKEN, or the one wlc keeps in ~/.config/weblate. */
export function tokenFrom(env: string | undefined, config: string | undefined): string | undefined {
  if (env) return env;
  const line = config?.split('\n').find((l) => l.trim().startsWith(API) && l.includes('='));
  return line?.split('=').slice(1).join('=').trim() || undefined;
}

export function readToken(): string | undefined {
  const file = path.join(homedir(), '.config/weblate');
  return tokenFrom(
    process.env.WEBLATE_TOKEN,
    existsSync(file) ? readFileSync(file, 'utf8') : undefined,
  );
}

export type UploadResult = { accepted: number; skipped: number; not_found: number; total: number };

/** Uploads a translated file as suggestions; untranslated-only, never overwriting. */
export async function uploadSuggestions(
  token: string,
  component: string,
  language: string,
  json: unknown,
): Promise<UploadResult> {
  const form = new FormData();
  form.append('file', new Blob([JSON.stringify(json)], { type: 'application/json' }), 'file.json');
  form.append('method', 'suggest');
  const url = `${API}translations/${PROJECT}/${component}/${language}/file/`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Token ${token}` },
    body: form,
  });
  if (!response.ok) {
    throw new Error(
      `Weblate ${component}/${language}: HTTP ${response.status} ${await response.text()}`,
    );
  }
  return (await response.json()) as UploadResult;
}

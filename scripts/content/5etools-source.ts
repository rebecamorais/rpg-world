/** Where the importers read the 5etools data from (a mirror pinned to a release). */
export const VERSION = 'v2.38.0';
const BASE = `https://raw.githubusercontent.com/5etools-mirror-3/5etools-src/${VERSION}/data`;

export async function fetchJson<T>(file: string): Promise<T> {
  const response = await fetch(`${BASE}/${file}`);
  if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
  return (await response.json()) as T;
}

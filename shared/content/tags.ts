/*
 * 5etools tags: `{@tag body|source|display}`. They stay in the stored rules text; the screens turn
 * the ones they know (`condition`) into links and show the rest as plain text.
 */

export type TagNode =
  | { kind: 'text'; text: string }
  | { kind: 'tag'; tag: string; target: string; display: string | null; text: string };

const TAG = /\{@(\w+)\s*([^{}]*)\}/g;
const TAG_START = /\{@(\w+)/y;

/** What 5etools shows for a tag with this (already flat) body. */
function shown(tag: string, parts: string[]): string {
  if (tag === 'chance') return `${parts[0]}%`;
  if (tag === 'dc') return `DC ${parts[0]}`;
  // The third part of these is a filter or a chapter, not display text
  if (tag === 'filter' || tag === 'book' || tag === 'adventure') return parts[0];
  if (tag === 'scaledamage' || tag === 'scaledice') return parts[2] ?? parts[0];
  return parts[2] || parts[0];
}

/** `{@tag text|source|display}` → what 5etools shows: the display text, or else the text. */
export function stripTags(text: string): string {
  let previous: string;
  let current = text;
  // Tags can nest ({@b {@dice 1d6}}): strip the innermost first, until none is left
  do {
    previous = current;
    current = current.replace(TAG, (_, tag: string, body: string) => shown(tag, body.split('|')));
  } while (current !== previous);
  return current;
}

/** Only the outer tags become nodes; what is nested inside a body is plain text in its `text`. */
export function parseTags(text: string): TagNode[] {
  const nodes: TagNode[] = [];
  let plain = '';
  let i = 0;
  while (i < text.length) {
    TAG_START.lastIndex = i;
    const start = text[i] === '{' ? TAG_START.exec(text) : null;
    let end = -1;
    if (start) {
      let depth = 0;
      for (let j = i; j < text.length; j++) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}' && --depth === 0) {
          end = j;
          break;
        }
      }
    }
    if (!start || end < 0) {
      plain += text[i++];
      continue;
    }
    if (plain) nodes.push({ kind: 'text', text: plain });
    plain = '';
    const tag = start[1];
    const body = stripTags(text.slice(i + start[0].length, end)).trim();
    const parts = body.split('|');
    nodes.push({
      kind: 'tag',
      tag,
      target: parts[0].trim().toLowerCase(),
      display: parts[2] || null,
      text: shown(tag, parts),
    });
    i = end + 1;
  }
  if (plain) nodes.push({ kind: 'text', text: plain });
  return nodes;
}

/** Every tag, nested ones included, innermost first (one pass per level, like `stripTags`). */
export function tagsOf(text: string): { tag: string; target: string }[] {
  const found: { tag: string; target: string }[] = [];
  let previous: string;
  let current = text;
  do {
    previous = current;
    current = current.replace(TAG, (_, tag: string, body: string) => {
      const parts = body.split('|');
      found.push({ tag, target: parts[0].trim().toLowerCase() });
      return shown(tag, parts);
    });
  } while (current !== previous);
  return found;
}

/** Ids of the `condition` tags in these texts: no repeats, alphabetical. */
export function conditionIdsOf(...texts: (string | null | undefined)[]): string[] {
  const ids = new Set<string>();
  for (const text of texts) {
    for (const { tag, target } of tagsOf(text ?? '')) if (tag === 'condition') ids.add(target);
  }
  return [...ids].sort();
}

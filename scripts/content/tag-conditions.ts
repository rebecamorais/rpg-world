/*
 * Wraps the words that name a condition in `{@condition id}` tags. It matches words, not meaning:
 * "a fallen shield" is tagged like "falls prone", so whatever it writes needs a human review.
 */

export type ConditionForms = { id: string; words: string[] };
export type TagOptions = { display: 'always' | 'when-different' };

/** One char at a time, so the folded text lines up with the original. */
function fold(text: string): string {
  return [...text]
    .map((c) => {
      const folded = c.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();
      return folded.length === c.length ? folded : c;
    })
    .join('');
}

const escape = (word: string) => word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** The text split into the parts outside tags (to tag) and whole tags, nested ones too (to keep). */
function split(text: string): { text: string; tagged: boolean }[] {
  const parts: { text: string; tagged: boolean }[] = [];
  let start = 0;
  let i = 0;
  while (i < text.length) {
    if (!text.startsWith('{@', i)) {
      i++;
      continue;
    }
    let depth = 0;
    let end = -1;
    for (let j = i; j < text.length; j++) {
      if (text[j] === '{') depth++;
      else if (text[j] === '}' && --depth === 0) {
        end = j;
        break;
      }
    }
    if (end < 0) break;
    if (i > start) parts.push({ text: text.slice(start, i), tagged: false });
    parts.push({ text: text.slice(i, end + 1), tagged: true });
    start = i = end + 1;
  }
  if (start < text.length) parts.push({ text: text.slice(start), tagged: false });
  return parts;
}

export function tagConditions(text: string, forms: ConditionForms[], options: TagOptions): string {
  const idOf = new Map<string, string>();
  for (const { id, words } of forms) for (const word of words) idOf.set(fold(word), id);
  if (idOf.size === 0) return text;
  // Longest first, so a form never stops at a shorter one; \b does not know accented letters
  const alternatives = [...idOf.keys()].sort((a, b) => b.length - a.length).map(escape);
  const words = new RegExp(
    `(?<![\\p{L}\\p{M}])(?:${alternatives.join('|')})(?![\\p{L}\\p{M}])`,
    'gu',
  );

  return split(text)
    .map((part) => {
      if (part.tagged) return part.text;
      const folded = fold(part.text);
      let out = '';
      let last = 0;
      for (const match of folded.matchAll(words)) {
        const word = part.text.slice(match.index, match.index + match[0].length);
        const id = idOf.get(match[0])!;
        const display = options.display === 'always' || word !== id ? `||${word}` : '';
        out += part.text.slice(last, match.index) + `{@condition ${id}${display}}`;
        last = match.index + match[0].length;
      }
      return out + part.text.slice(last);
    })
    .join('');
}

type Message = string | Message[] | Messages;
type Messages = { [key: string]: Message };

const isText = (value: unknown): value is string => typeof value === 'string' && value !== '';

function fallback(translated: unknown, source: Message): Message {
  if (typeof source === 'string') return isText(translated) ? translated : source;
  if (Array.isArray(source)) {
    const items = Array.isArray(translated) ? translated : [];
    return source.map((item, i) => fallback(items[i], item));
  }
  const group = typeof translated === 'object' && translated !== null ? translated : {};
  return Object.fromEntries(
    Object.entries(source).map(([key, value]) => [key, fallback((group as Messages)[key], value)]),
  );
}

/**
 * A language's messages completed with the English ones: next-intl fails on a missing key, and
 * Weblate leaves what is not translated yet out of the file (or empty). Follows the English shape,
 * so keys English no longer has are dropped.
 */
export const withFallback = <T extends Messages>(translated: Messages, en: T): T =>
  fallback(translated, en) as T;

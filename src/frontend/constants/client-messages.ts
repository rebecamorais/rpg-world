/**
 * Message namespaces only server components read (getTranslations). They stay out of the messages
 * handed to the browser on every page; a client component that needs one must be listed out of
 * here first (client-messages.unit.test.ts checks).
 */
export const SERVER_ONLY_NAMESPACES = ['terms', 'privacy', 'seo', 'home'] as const;

/** The messages the client components use: everything but the server-only namespaces. */
export function clientMessages(messages: Record<string, unknown>): Record<string, unknown> {
  const server: ReadonlySet<string> = new Set(SERVER_ONLY_NAMESPACES);
  return Object.fromEntries(
    Object.entries(messages).filter(([namespace]) => !server.has(namespace)),
  );
}

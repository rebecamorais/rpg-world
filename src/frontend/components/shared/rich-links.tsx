import { ReactNode } from 'react';

const LINK_CLASS = 'text-primary-flare hover:text-foreground underline underline-offset-4';

/**
 * Turns `{ tag: href }` into the values `t.rich` expects, so each tag pair in a message
 * becomes a link. Web links open in a new tab; `mailto:` links don't.
 */
export function richLinks(hrefs: Record<string, string>) {
  return Object.fromEntries(
    Object.entries(hrefs).map(([tag, href]) => [
      tag,
      function RichLink(chunks: ReactNode) {
        const external = href.startsWith('http');
        return (
          <a
            href={href}
            className={LINK_CLASS}
            {...(external && { target: '_blank', rel: 'noopener noreferrer' })}
          >
            {chunks}
          </a>
        );
      },
    ]),
  );
}

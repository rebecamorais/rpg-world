import { expect } from '@playwright/test';

import { supabaseTestEnv } from './env';

interface MailpitSearch {
  messages: { ID: string }[];
}

/** Waits for the e-mail sent to `to` and returns its HTML (from the test stack's Mailpit). */
export async function waitForEmail(to: string): Promise<string> {
  const { mailUrl } = supabaseTestEnv();
  let id: string | undefined;

  await expect
    .poll(
      async () => {
        const res = await fetch(
          `${mailUrl}/api/v1/search?query=${encodeURIComponent(`to:"${to}"`)}`,
        );
        id = ((await res.json()) as MailpitSearch).messages[0]?.ID;
        return id;
      },
      { message: `no e-mail arrived for ${to}`, timeout: 15_000 },
    )
    .toBeTruthy();

  const res = await fetch(`${mailUrl}/api/v1/message/${id}`);
  return ((await res.json()) as { HTML: string }).HTML;
}

/** First link in the e-mail whose URL contains `fragment`. */
export function linkIn(html: string, fragment: string): string {
  const link = [...html.matchAll(/href="([^"]+)"/g)]
    .map(([, href]) => href.replaceAll('&amp;', '&'))
    .find((href) => href.includes(fragment));
  if (!link) throw new Error(`no link containing "${fragment}" in the e-mail`);
  return link;
}

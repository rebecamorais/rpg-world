import type { SupabaseClient } from '@supabase/supabase-js';

type Message = { event: string; payload: Record<string, unknown> };

/**
 * Subscribes `client` to the party's private channel, as the app does, and collects the
 * "encounter" broadcasts. Resolves once the subscription is answered: SUBSCRIBED, or the error
 * (CHANNEL_ERROR when the database refuses who is asking).
 */
export async function listen(client: SupabaseClient, partyId: string) {
  await client.realtime.setAuth();
  const messages: Message[] = [];
  const channel = client
    .channel(`party:${partyId}`, { config: { private: true } })
    .on('broadcast', { event: 'encounter' }, (message) =>
      messages.push(message as unknown as Message),
    );

  const status = await new Promise<string>((resolve) => {
    channel.subscribe((s) => resolve(s));
  });
  return { status, messages, channel };
}

/** Waits until `messages` has at least `count` entries, or `ms` pass. */
export async function waitFor(messages: unknown[], count: number, ms = 5000) {
  const deadline = Date.now() + ms;
  while (messages.length < count && Date.now() < deadline) {
    await new Promise((resolve) => setTimeout(resolve, 50));
  }
  return messages.length;
}

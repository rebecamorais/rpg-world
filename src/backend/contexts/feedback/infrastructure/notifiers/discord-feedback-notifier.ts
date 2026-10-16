/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import 'server-only';

import { Feedback, FeedbackType } from '../../domain/Feedback';
import { FeedbackNotifier } from '../../domain/FeedbackNotifier';

const TYPES: Record<FeedbackType, { label: string; color: number }> = {
  [FeedbackType.BUG]: { label: '🐞 Bug', color: 0xed4245 },
  [FeedbackType.FEATURE]: { label: '✨ Sugestão', color: 0x5865f2 },
  [FeedbackType.FEEDBACK]: { label: '💬 Feedback', color: 0x57f287 },
  [FeedbackType.ACCOUNT]: { label: '👤 Conta', color: 0xfee75c },
};

// Discord caps an embed description at 4096 characters
const MAX_MESSAGE = 4000;

/** Posts each feedback to a Discord channel through an incoming webhook. */
export class DiscordFeedbackNotifier implements FeedbackNotifier {
  constructor(private readonly webhookUrl: string) {}

  async notify(feedback: Feedback): Promise<void> {
    const type = TYPES[feedback.type] ?? TYPES[FeedbackType.FEEDBACK];
    const message =
      feedback.message.length > MAX_MESSAGE
        ? `${feedback.message.slice(0, MAX_MESSAGE)}…`
        : feedback.message;

    const response = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(5000),
      body: JSON.stringify({
        // The text comes from visitors: no @everyone or role pings
        allowed_mentions: { parse: [] },
        embeds: [
          {
            title: type.label,
            description: message,
            color: type.color,
            fields: [
              { name: 'E-mail', value: feedback.email, inline: true },
              {
                name: 'Conta',
                value: feedback.userId ? `\`${feedback.userId}\`` : 'anônimo',
                inline: true,
              },
            ],
            footer: { text: `Feedback ${feedback.id}` },
            timestamp: feedback.createdAt.toISOString(),
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Discord webhook answered ${response.status}`);
    }
  }
}

/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { SupabaseClient } from '@supabase/supabase-js';

import { SubmitFeedbackUseCase } from './application/submit-feedback.use-case';
import { DiscordFeedbackNotifier } from './infrastructure/notifiers/discord-feedback-notifier';
import { SupabaseFeedbackRepository } from './infrastructure/repositories/supabase-feedback-repository';

export interface FeedbackContext {
  submitFeedback: SubmitFeedbackUseCase;
}

export const createFeedbackContext = (dbClient: SupabaseClient): FeedbackContext => {
  const feedbackRepository = new SupabaseFeedbackRepository(dbClient);
  const webhookUrl = process.env.DISCORD_FEEDBACK_WEBHOOK_URL?.trim();
  const notifier = webhookUrl ? new DiscordFeedbackNotifier(webhookUrl) : undefined;

  return {
    submitFeedback: new SubmitFeedbackUseCase(feedbackRepository, notifier),
  };
};

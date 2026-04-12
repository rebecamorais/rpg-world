/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { SupabaseClient } from '@supabase/supabase-js';

import { SubmitFeedbackUseCase } from './application/submit-feedback.use-case';
import { SupabaseFeedbackRepository } from './infrastructure/repositories/supabase-feedback-repository';

export interface FeedbackContext {
  submitFeedback: SubmitFeedbackUseCase;
}

export const createFeedbackContext = (dbClient: SupabaseClient): FeedbackContext => {
  const feedbackRepository = new SupabaseFeedbackRepository(dbClient);

  return {
    submitFeedback: new SubmitFeedbackUseCase(feedbackRepository),
  };
};

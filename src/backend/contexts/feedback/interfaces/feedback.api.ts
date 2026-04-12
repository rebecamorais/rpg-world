/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { FeedbackContext } from '../../feedback';
import { NewFeedback } from '../domain/Feedback';

export const makeFeedbackApi = (feedbackContext: FeedbackContext) => ({
  submitFeedback: async (feedback: NewFeedback) => {
    const result = await feedbackContext.submitFeedback.execute(feedback);
    return { success: true, data: result };
  },
});

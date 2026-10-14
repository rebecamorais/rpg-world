/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Feedback, NewFeedback } from '../domain/Feedback';
import { FeedbackError, FeedbackErrorCodes } from '../domain/FeedbackError';
import { FeedbackRepository } from '../domain/FeedbackRepository';

export class SubmitFeedbackUseCase {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async execute(feedback: NewFeedback): Promise<Feedback> {
    if (!feedback.email || !feedback.email.includes('@')) {
      throw new FeedbackError(FeedbackErrorCodes.INVALID_EMAIL);
    }

    if (!feedback.message || feedback.message.length < 10) {
      throw new FeedbackError(FeedbackErrorCodes.MESSAGE_TOO_SHORT);
    }

    return this.feedbackRepository.save(feedback);
  }
}

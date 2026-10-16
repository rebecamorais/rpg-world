/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Feedback, NewFeedback } from '../domain/Feedback';
import { FeedbackError, FeedbackErrorCodes } from '../domain/FeedbackError';
import { FeedbackNotifier } from '../domain/FeedbackNotifier';
import { FeedbackRepository } from '../domain/FeedbackRepository';

export class SubmitFeedbackUseCase {
  constructor(
    private readonly feedbackRepository: FeedbackRepository,
    private readonly notifier?: FeedbackNotifier,
  ) {}

  async execute(feedback: NewFeedback): Promise<Feedback> {
    if (!feedback.email || !feedback.email.includes('@')) {
      throw new FeedbackError(FeedbackErrorCodes.INVALID_EMAIL);
    }

    if (!feedback.message || feedback.message.length < 10) {
      throw new FeedbackError(FeedbackErrorCodes.MESSAGE_TOO_SHORT);
    }

    const saved = await this.feedbackRepository.save(feedback);

    // A notification failure must not turn a saved feedback into an error for the visitor
    try {
      await this.notifier?.notify(saved);
    } catch (error) {
      console.error('Feedback notification failed:', error);
    }

    return saved;
  }
}

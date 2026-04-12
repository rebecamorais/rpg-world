/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Feedback, NewFeedback } from '../domain/Feedback';
import { FeedbackRepository } from '../domain/FeedbackRepository';

export class SubmitFeedbackUseCase {
  constructor(private readonly feedbackRepository: FeedbackRepository) {}

  async execute(feedback: NewFeedback): Promise<Feedback> {
    if (!feedback.email || !feedback.email.includes('@')) {
      throw new Error('A valid email is required.');
    }

    if (!feedback.message || feedback.message.length < 10) {
      throw new Error('Message must be at least 10 characters long.');
    }

    return this.feedbackRepository.save(feedback);
  }
}

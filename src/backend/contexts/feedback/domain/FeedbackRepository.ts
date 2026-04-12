/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Feedback, NewFeedback } from './Feedback';

export interface FeedbackRepository {
  save(feedback: NewFeedback): Promise<Feedback>;
}

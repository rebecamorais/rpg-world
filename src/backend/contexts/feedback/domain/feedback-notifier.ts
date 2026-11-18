/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { Feedback } from './Feedback';

/** Tells the team a feedback arrived. Best effort: the feedback is already saved. */
export interface FeedbackNotifier {
  notify(feedback: Feedback): Promise<void>;
}

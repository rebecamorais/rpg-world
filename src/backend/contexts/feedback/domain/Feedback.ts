/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

export enum FeedbackType {
  BUG = 'bug',
  FEATURE = 'feature',
  FEEDBACK = 'feedback',
  ACCOUNT = 'account',
}

export enum FeedbackStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  CLOSED = 'closed',
}

export interface Feedback {
  id: string;
  userId?: string;
  email: string;
  type: FeedbackType;
  message: string;
  status: FeedbackStatus;
  createdAt: Date;
}

export type NewFeedback = Pick<Feedback, 'email' | 'type' | 'message' | 'userId'>;

import { AppError } from '@backend/shared/domain/AppError';

export const FeedbackErrorCodes = {
  INVALID_EMAIL: 'feedback_error_invalid_email',
  MESSAGE_TOO_SHORT: 'feedback_error_message_too_short',
} as const;

export type FeedbackErrorCode = (typeof FeedbackErrorCodes)[keyof typeof FeedbackErrorCodes];

export class FeedbackError extends AppError {
  constructor(code: FeedbackErrorCode) {
    super(code, 'validation');
    this.name = 'FeedbackError';
  }
}

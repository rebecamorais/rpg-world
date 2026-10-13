import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

import { submitFeedbackAction } from './submit-feedback-action';

const submitFeedback = vi.fn();
const getSessionUser = vi.fn();

vi.mock('@api', () => ({
  getApi: async () => ({
    authApi: { getSessionUser },
    feedbackApi: { submitFeedback },
  }),
}));

vi.mock('@backend/shared/infrastructure/services/turnstile-service', () => ({
  TurnstileService: { verify: vi.fn() },
}));

const verify = vi.mocked(TurnstileService.verify);

const validFeedback = {
  email: 'user@example.com',
  type: 'bug',
  message: 'Something is broken here',
};

describe('submitFeedbackAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getSessionUser.mockResolvedValue(null);
    submitFeedback.mockResolvedValue({ success: true });
  });

  it('does not save the feedback when the Turnstile token is invalid', async () => {
    verify.mockResolvedValue({ success: false, error: 'security_verification_failed' });

    const result = await submitFeedbackAction({ ...validFeedback, turnstileToken: 'bad-token' });

    expect(result).toEqual({ success: false, error: 'security_verification_failed' });
    expect(verify).toHaveBeenCalledWith('bad-token');
    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it('saves the feedback with the session user when the Turnstile token is valid', async () => {
    verify.mockResolvedValue({ success: true });
    getSessionUser.mockResolvedValue({ id: 'user-1' });

    const result = await submitFeedbackAction({ ...validFeedback, turnstileToken: 'good-token' });

    expect(result).toEqual({ success: true });
    expect(submitFeedback).toHaveBeenCalledWith({ ...validFeedback, userId: 'user-1' });
  });

  it('returns invalid_request without verifying Turnstile when the input is invalid', async () => {
    const result = await submitFeedbackAction({
      ...validFeedback,
      message: 'short',
      turnstileToken: 'good-token',
    });

    expect(result).toEqual({ success: false, error: 'common_error_invalid_request' });
    expect(verify).not.toHaveBeenCalled();
    expect(submitFeedback).not.toHaveBeenCalled();
  });

  it('returns an error code when saving fails', async () => {
    vi.spyOn(console, 'error').mockImplementationOnce(() => {});
    verify.mockResolvedValue({ success: true });
    submitFeedback.mockRejectedValue(new Error('db down'));

    const result = await submitFeedbackAction({ ...validFeedback, turnstileToken: 'good-token' });

    expect(result).toEqual({ success: false, error: 'common_error_unexpected' });
  });
});

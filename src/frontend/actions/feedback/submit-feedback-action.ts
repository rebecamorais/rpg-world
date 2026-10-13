/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

'use server';

import { getApi } from '@api';

import { submitFeedbackSchema } from '@backend/contexts/feedback/interfaces/feedback.schemas';
import { TurnstileService } from '@backend/shared/infrastructure/services/turnstile-service';

import { errorCode } from '@shared/http/error-response';
import { INVALID_REQUEST } from '@shared/http/validation';

import type { ActionResponse } from '../auth/sign-up-action';

export async function submitFeedbackAction(formData: {
  email: string;
  type: string;
  message: string;
  turnstileToken: string;
}): Promise<ActionResponse> {
  const input = submitFeedbackSchema.safeParse(formData);
  if (!input.success) {
    return { success: false, error: INVALID_REQUEST };
  }

  const { turnstileToken, ...feedback } = input.data;

  // Anonymous submissions are allowed and saved with the service role, so require Turnstile.
  const turnstile = await TurnstileService.verify(turnstileToken);
  if (!turnstile.success) {
    return { success: false, error: turnstile.error || 'security_verification_failed' };
  }

  try {
    const api = await getApi();
    const user = await api.authApi.getSessionUser();
    await api.feedbackApi.submitFeedback({ ...feedback, userId: user?.id });
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: errorCode(error) };
  }
}

/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

'use server';

import { getApi } from '@api';

import { submitFeedbackSchema } from '@backend/contexts/feedback/interfaces/feedback.schemas';

import { parseInput } from '@shared/http/validation';

export async function submitFeedbackAction(formData: {
  email: string;
  type: string;
  message: string;
}) {
  const feedback = parseInput(submitFeedbackSchema, formData);
  const api = await getApi();

  // Try to get the current user session
  const user = await api.authApi.getSessionUser();

  return api.feedbackApi.submitFeedback({ ...feedback, userId: user?.id });
}

/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */

'use server';

import { getApi } from '@api';

import { FeedbackType } from '@backend/contexts/feedback/domain/Feedback';

export async function submitFeedbackAction(formData: {
  email: string;
  type: string;
  message: string;
}) {
  const api = await getApi();

  // Try to get the current user session
  const user = await api.authApi.getSessionUser();

  const result = await api.feedbackApi.submitFeedback({
    email: formData.email,
    type: formData.type as FeedbackType,
    message: formData.message,
    userId: user?.id,
  });

  return result;
}

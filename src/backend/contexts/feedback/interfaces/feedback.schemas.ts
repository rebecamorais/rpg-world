import { z } from 'zod';

import { FeedbackType } from '../domain/Feedback';

export const submitFeedbackSchema = z.object({
  email: z.email().max(320),
  type: z.enum(FeedbackType),
  message: z.string().min(10).max(5_000),
});

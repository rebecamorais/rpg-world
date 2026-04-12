/**
 * Copyright (c) 2026 Rebeca Morais Cruz (Rebs Tech Studio). Licenciado sob a GNU GPLv3.
 */
import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { Feedback, FeedbackStatus, FeedbackType, NewFeedback } from '../../domain/Feedback';
import { FeedbackRepository } from '../../domain/FeedbackRepository';

export class SupabaseFeedbackRepository implements FeedbackRepository {
  constructor(private readonly dbClient: SupabaseClient) {}

  async save(feedback: NewFeedback): Promise<Feedback> {
    const { data, error } = await this.dbClient
      .from('feedback')
      .insert({
        user_id: feedback.userId,
        email: feedback.email,
        type: feedback.type,
        message: feedback.message,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save feedback: ${error.message}`);
    }

    if (!data) {
      throw new Error('Failed to save feedback: No data returned');
    }

    return {
      id: data.id,
      userId: data.user_id ?? undefined,
      email: data.email,
      type: data.type as FeedbackType,
      message: data.message,
      status: data.status as FeedbackStatus,
      createdAt: new Date(data.created_at),
    };
  }
}

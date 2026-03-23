import { SupabaseClient } from '@supabase/supabase-js';
import 'server-only';

import { EmailService } from '../../domain/EmailService';
import { ResendEmailService } from '../services/resend-email-service';
import { SupabaseEmailService } from '../services/supabase-email-service';

export const createEmailService = (
  _authClient: SupabaseClient,
  _dbClient: SupabaseClient,
): EmailService => {
  const resendApiKey = process.env.RESEND_API_KEY;
  const emailFrom = process.env.EMAIL_FROM || 'RPG World <no-reply@rpgworld.com>';

  // Use Resend only in Production.
  const isProd = process.env.NODE_ENV === 'production';
  const isResendConfigured = isProd && resendApiKey;

  if (isResendConfigured) {
    return new ResendEmailService(resendApiKey, emailFrom);
  }

  // Fallback to local SMTP (Inbucket) + Console logging for dev/test
  return new SupabaseEmailService(emailFrom);
};

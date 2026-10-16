import 'server-only';

import { EmailService } from '../../domain/EmailService';
import { PreviewEmailService } from '../services/preview-email-service';
import { ResendEmailService } from '../services/resend-email-service';
import { SupabaseEmailService } from '../services/supabase-email-service';

export const createEmailService = (): EmailService => {
  // Previews run on the staging Supabase: links go to the screen instead of a real inbox
  if (process.env.VERCEL_ENV === 'preview') {
    return new PreviewEmailService();
  }

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

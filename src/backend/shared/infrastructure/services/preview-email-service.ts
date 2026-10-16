import 'server-only';

import { EmailDelivery, EmailService } from '../../domain/EmailService';

/**
 * E-mail service of preview deployments (staging Supabase, no Resend key).
 *
 * Nothing is sent: the link goes back to the screen, so whoever tests a pull request can
 * confirm the account or reset the password right there.
 */
export class PreviewEmailService implements EmailService {
  async sendConfirmationEmail(_email: string, confirmationLink: string): Promise<EmailDelivery> {
    return { previewLink: confirmationLink };
  }

  async sendPasswordResetEmail(_email: string, resetLink: string): Promise<EmailDelivery> {
    return { previewLink: resetLink };
  }
}

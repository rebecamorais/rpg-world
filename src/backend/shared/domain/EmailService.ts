import 'server-only';

export interface EmailService {
  sendConfirmationEmail(email: string, confirmationLink: string): Promise<void>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
}

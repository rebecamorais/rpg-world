export interface EmailService {
  sendConfirmationEmail(email: string, confirmationLink: string): Promise<void>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
  sendMagicLinkEmail(email: string, signInLink: string): Promise<void>;
  /** Tells the owner of an already registered e-mail that someone tried to sign up with it. */
  sendAccountExistsEmail(email: string, forgotPasswordLink: string): Promise<void>;
  sendAccountDeletionEmail(email: string, confirmLink: string): Promise<void>;
  /** Tells the owner the password changed, with a way to pick a new one if it wasn't them. */
  sendPasswordChangedEmail(email: string, forgotPasswordLink: string): Promise<void>;
}

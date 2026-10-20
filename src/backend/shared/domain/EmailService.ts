export interface EmailService {
  sendConfirmationEmail(email: string, confirmationLink: string): Promise<void>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<void>;
  /** Tells the owner of an already registered e-mail that someone tried to sign up with it. */
  sendAccountExistsEmail(email: string, forgotPasswordLink: string): Promise<void>;
}

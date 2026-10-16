/** What happened to an e-mail. A preview deployment sends nothing and hands the link back instead. */
export interface EmailDelivery {
  previewLink?: string;
}

export interface EmailService {
  sendConfirmationEmail(email: string, confirmationLink: string): Promise<EmailDelivery>;
  sendPasswordResetEmail(email: string, resetLink: string): Promise<EmailDelivery>;
}

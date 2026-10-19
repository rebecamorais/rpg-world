import * as React from 'react';

import { Resend } from 'resend';
import 'server-only';

import { EmailService } from '../../domain/EmailService';
import { AccountExistsTemplate } from '../email/templates/AccountExists';
import { EmailConfirmationTemplate } from '../email/templates/EmailConfirmation';
import { PasswordResetTemplate } from '../email/templates/PasswordReset';

export class ResendEmailService implements EmailService {
  private resend: Resend;

  constructor(
    apiKey: string,
    private readonly fromEmail: string,
  ) {
    this.resend = new Resend(apiKey);
  }

  async sendConfirmationEmail(email: string, confirmationLink: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: [email],
      subject: 'Confirme seu e-mail - RPG World',
      react: React.createElement(EmailConfirmationTemplate, { confirmationLink }),
    });

    if (error) {
      throw new Error(`Failed to send confirmation email: ${error.message}`);
    }
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: [email],
      subject: 'Redefinição de senha - RPG World',
      react: React.createElement(PasswordResetTemplate, { resetLink }),
    });

    if (error) {
      throw new Error(`Failed to send password reset email: ${error.message}`);
    }
  }

  async sendAccountExistsEmail(email: string, forgotPasswordLink: string): Promise<void> {
    const { error } = await this.resend.emails.send({
      from: this.fromEmail,
      to: [email],
      subject: 'Você já tem uma conta - RPG World',
      react: React.createElement(AccountExistsTemplate, { forgotPasswordLink }),
    });

    if (error) {
      throw new Error(`Failed to send account exists email: ${error.message}`);
    }
  }
}

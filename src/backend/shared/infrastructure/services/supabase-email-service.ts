import * as React from 'react';

import nodemailer, { type Transporter } from 'nodemailer';
import { render } from 'react-email';
import 'server-only';

import { EmailDelivery, EmailService } from '../../domain/EmailService';
import { EmailConfirmationTemplate } from '../email/templates/EmailConfirmation';
import { PasswordResetTemplate } from '../email/templates/PasswordReset';

/**
 * Unified Local Email Service for Development.
 *
 * This service sends actual custom React Email templates to the local Inbucket over SMTP
 * and logs the important links to the console for easy developer access.
 */
export class SupabaseEmailService implements EmailService {
  private readonly transporter: Transporter;

  constructor(private readonly fromEmail: string) {
    this.transporter = nodemailer.createTransport({
      host: '127.0.0.1',
      // Inbucket SMTP of the local stack: 54325 for dev, 54425 for the test stack (e2e)
      port: Number(process.env.LOCAL_SMTP_PORT) || 54325,
      secure: false, // Inbucket local não usa TLS
    });
  }

  async sendConfirmationEmail(email: string, confirmationLink: string): Promise<EmailDelivery> {
    const html = await render(React.createElement(EmailConfirmationTemplate, { confirmationLink }));

    console.log('\n--- DEVELOPMENT EMAIL (CONSOLE) ---');
    console.log(`To: ${email}`);
    console.log(`Confirmation Link: ${confirmationLink}`);

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Confirme seu e-mail - RPG World',
        html,
      });
      console.log('Status: Email sent to local Inbucket.');
    } catch (error) {
      console.warn('Warning: Could not connect to the local Inbucket SMTP server.');
      console.warn('Make sure Inbucket is running if you want to test the email UI.');
      console.warn(`Error: ${(error as Error).message}`);
    }
    console.log('-------------------------------------\n');
    return {};
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<EmailDelivery> {
    const html = await render(React.createElement(PasswordResetTemplate, { resetLink }));

    console.log('\n--- DEVELOPMENT EMAIL (CONSOLE) ---');
    console.log(`To: ${email}`);
    console.log(`Reset Link: ${resetLink}`);

    try {
      await this.transporter.sendMail({
        from: this.fromEmail,
        to: email,
        subject: 'Redefinição de senha - RPG World',
        html,
      });
      console.log('Status: Email sent to local Inbucket.');
    } catch (error) {
      console.warn('Warning: Could not connect to the local Inbucket SMTP server.');
      console.warn('Make sure Inbucket is running if you want to test the email UI.');
      console.warn(`Error: ${(error as Error).message}`);
    }
    console.log('-------------------------------------\n');
    return {};
  }
}

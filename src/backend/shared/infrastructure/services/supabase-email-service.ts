import * as React from 'react';

import { render } from '@react-email/render';
import nodemailer from 'nodemailer';
import 'server-only';

import { EmailService } from '../../domain/EmailService';
import { EmailConfirmationTemplate } from '../email/templates/EmailConfirmation';
import { PasswordResetTemplate } from '../email/templates/PasswordReset';

/**
 * Unified Local Email Service for Development.
 *
 * This service sends actual custom React Email templates to Inbucket (SMTP localhost:1025)
 * and logs the important links to the console for easy developer access.
 */
export class SupabaseEmailService implements EmailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly fromEmail: string) {
    this.transporter = nodemailer.createTransport({
      host: '127.0.0.1',
      port: 54325,
      secure: false, // Inbucket local não usa TLS
    });
  }

  async sendConfirmationEmail(email: string, confirmationLink: string): Promise<void> {
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
      console.log('Status: Email sent to local Inbucket (54325).');
    } catch (error) {
      console.warn('Warning: Could not connect to Inbucket at 127.0.0.1:54325.');
      console.warn('Make sure Inbucket is running if you want to test the email UI.');
      console.warn(`Error: ${(error as Error).message}`);
    }
    console.log('-------------------------------------\n');
  }

  async sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
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
      console.log('Status: Email sent to local Inbucket (54325).');
    } catch (error) {
      console.warn('Warning: Could not connect to Inbucket at 127.0.0.1:54325.');
      console.warn('Make sure Inbucket is running if you want to test the email UI.');
      console.warn(`Error: ${(error as Error).message}`);
    }
    console.log('-------------------------------------\n');
  }
}

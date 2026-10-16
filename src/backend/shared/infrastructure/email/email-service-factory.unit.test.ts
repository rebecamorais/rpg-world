import { afterEach, describe, expect, it, vi } from 'vitest';

import { PreviewEmailService } from '../services/preview-email-service';
import { ResendEmailService } from '../services/resend-email-service';
import { SupabaseEmailService } from '../services/supabase-email-service';
import { createEmailService } from './email-service-factory';

describe('createEmailService', () => {
  afterEach(() => vi.unstubAllEnvs());

  it('uses Resend in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'production');
    vi.stubEnv('RESEND_API_KEY', 're_test');

    expect(createEmailService()).toBeInstanceOf(ResendEmailService);
  });

  it('sends nothing on a preview deployment, even with a Resend key', () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.stubEnv('VERCEL_ENV', 'preview');
    vi.stubEnv('RESEND_API_KEY', 're_test');

    expect(createEmailService()).toBeInstanceOf(PreviewEmailService);
  });

  it('falls back to the local Inbucket outside Vercel', () => {
    vi.stubEnv('NODE_ENV', 'development');
    vi.stubEnv('VERCEL_ENV', '');

    expect(createEmailService()).toBeInstanceOf(SupabaseEmailService);
  });
});

describe('PreviewEmailService', () => {
  const service = new PreviewEmailService();

  it('hands back the confirmation link instead of sending it', async () => {
    await expect(service.sendConfirmationEmail('a@b.co', 'https://confirm')).resolves.toEqual({
      previewLink: 'https://confirm',
    });
  });

  it('hands back the reset link instead of sending it', async () => {
    await expect(service.sendPasswordResetEmail('a@b.co', 'https://reset')).resolves.toEqual({
      previewLink: 'https://reset',
    });
  });
});

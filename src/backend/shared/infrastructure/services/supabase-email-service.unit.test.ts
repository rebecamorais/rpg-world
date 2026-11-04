import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SupabaseEmailService } from './supabase-email-service';

const sendMail = vi.fn();

vi.mock('nodemailer', () => ({
  default: { createTransport: () => ({ sendMail }) },
}));

const EMAIL = 'hero@example.com';
const LINK = 'https://rpg.test/en/delete-account?token=the-secret-token';

describe('SupabaseEmailService.sendAccountDeletionEmail', () => {
  beforeEach(() => {
    sendMail.mockReset();
  });

  it('envia o link no e-mail', async () => {
    await new SupabaseEmailService('from@rpg.test').sendAccountDeletionEmail(EMAIL, LINK);

    const mail = sendMail.mock.calls[0][0];
    expect(mail.to).toBe(EMAIL);
    expect(mail.html).toContain('the-secret-token');
  });

  it.each([
    ['com sucesso', () => sendMail.mockResolvedValue({})],
    [
      'com falha do SMTP',
      () => sendMail.mockRejectedValue(new Error(`rejected: ${EMAIL} ${LINK}`)),
    ],
  ])('não registra e-mail nem token no console, %s', async (_label, arrange) => {
    arrange();
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});

    await new SupabaseEmailService('from@rpg.test').sendAccountDeletionEmail(EMAIL, LINK);

    const printed = JSON.stringify([log.mock.calls, warn.mock.calls]);
    expect(printed).not.toContain(EMAIL);
    expect(printed).not.toContain('the-secret-token');
    log.mockRestore();
    warn.mockRestore();
  });
});

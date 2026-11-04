import { beforeEach, describe, expect, it, vi } from 'vitest';

import { ResendEmailService } from './resend-email-service';

const send = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send };
  },
}));

const EMAIL = 'hero@example.com';
const LINK = 'https://rpg.test/en/delete-account?token=the-secret-token';

describe('ResendEmailService.sendAccountDeletionEmail', () => {
  beforeEach(() => {
    send.mockReset();
  });

  it('envia para a conta, com o link no modelo', async () => {
    send.mockResolvedValue({ error: null });

    await new ResendEmailService('key', 'from@rpg.test').sendAccountDeletionEmail(EMAIL, LINK);

    const mail = send.mock.calls[0][0];
    expect(mail.to).toEqual([EMAIL]);
    expect(mail.react.props.confirmLink).toBe(LINK);
  });

  it('o erro do provedor não leva o endereço para o log', async () => {
    send.mockResolvedValue({
      error: { name: 'validation_error', message: `Invalid to: ${EMAIL}` },
    });

    const error = await new ResendEmailService('key', 'from@rpg.test')
      .sendAccountDeletionEmail(EMAIL, LINK)
      .catch((e: Error) => e);

    expect((error as Error).message).toContain('validation_error');
    expect((error as Error).message).not.toContain(EMAIL);
  });
});

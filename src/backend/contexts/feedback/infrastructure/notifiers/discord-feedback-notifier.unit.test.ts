import { afterEach, describe, expect, it, vi } from 'vitest';

import { Feedback, FeedbackStatus, FeedbackType } from '../../domain/Feedback';
import { DiscordFeedbackNotifier } from './discord-feedback-notifier';

const FEEDBACK: Feedback = {
  id: 'f1',
  email: 'visitor@example.com',
  type: FeedbackType.BUG,
  message: '@everyone a lista de magias não carrega',
  status: FeedbackStatus.OPEN,
  createdAt: new Date('2026-10-16T12:00:00Z'),
};

const WEBHOOK = 'https://discord.com/api/webhooks/1/token';

describe('DiscordFeedbackNotifier', () => {
  const fetchMock = vi.fn();
  vi.stubGlobal('fetch', fetchMock);

  afterEach(() => fetchMock.mockReset());

  const sentBody = () => JSON.parse(fetchMock.mock.calls[0][1].body);

  it('posta o feedback como embed no webhook, sem permitir menções', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await new DiscordFeedbackNotifier(WEBHOOK).notify(FEEDBACK);

    expect(fetchMock).toHaveBeenCalledWith(WEBHOOK, expect.objectContaining({ method: 'POST' }));
    const body = sentBody();
    expect(body.allowed_mentions).toEqual({ parse: [] });
    expect(body.embeds[0]).toMatchObject({
      title: '🐞 Bug',
      description: FEEDBACK.message,
      timestamp: '2026-10-16T12:00:00.000Z',
    });
    expect(body.embeds[0].fields).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'E-mail', value: 'visitor@example.com' }),
        expect.objectContaining({ name: 'Conta', value: 'anônimo' }),
      ]),
    );
  });

  it('corta mensagens longas abaixo do limite do Discord', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));

    await new DiscordFeedbackNotifier(WEBHOOK).notify({ ...FEEDBACK, message: 'a'.repeat(5000) });

    expect(sentBody().embeds[0].description.length).toBeLessThanOrEqual(4096);
  });

  it('lança quando o Discord recusa', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 404 }));

    await expect(new DiscordFeedbackNotifier(WEBHOOK).notify(FEEDBACK)).rejects.toThrow('404');
  });
});

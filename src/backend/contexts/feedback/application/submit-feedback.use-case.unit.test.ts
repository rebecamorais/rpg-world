import { beforeEach, describe, expect, it, vi } from 'vitest';

import { FeedbackStatus, FeedbackType, NewFeedback } from '../domain/Feedback';
import { FeedbackError, FeedbackErrorCodes } from '../domain/FeedbackError';
import { FeedbackRepository } from '../domain/FeedbackRepository';
import { SubmitFeedbackUseCase } from './submit-feedback.use-case';

const FEEDBACK: NewFeedback = {
  email: 'visitor@example.com',
  type: FeedbackType.BUG,
  message: 'The spell list does not load.',
};

describe('SubmitFeedbackUseCase', () => {
  const save = vi.fn();
  const useCase = new SubmitFeedbackUseCase({ save } as FeedbackRepository);

  beforeEach(() => {
    save.mockReset();
    save.mockImplementation(async (feedback: NewFeedback) => ({
      ...feedback,
      id: 'f1',
      status: FeedbackStatus.OPEN,
      createdAt: new Date(),
    }));
  });

  it('grava o feedback válido', async () => {
    const saved = await useCase.execute(FEEDBACK);

    expect(saved.id).toBe('f1');
    expect(save).toHaveBeenCalledWith(FEEDBACK);
  });

  it.each([
    ['e-mail inválido', { email: 'not-an-email' }, FeedbackErrorCodes.INVALID_EMAIL],
    ['mensagem curta', { message: 'too short' }, FeedbackErrorCodes.MESSAGE_TOO_SHORT],
  ])('recusa %s com erro de validação traduzível', async (_label, override, code) => {
    const error = await useCase.execute({ ...FEEDBACK, ...override }).catch((e) => e);

    expect(error).toBeInstanceOf(FeedbackError);
    expect(error.code).toBe(code);
    expect(error.kind).toBe('validation');
    expect(save).not.toHaveBeenCalled();
  });
});

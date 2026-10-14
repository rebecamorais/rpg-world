import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppError } from '@backend/shared/domain/AppError';

import { updatePasswordAction } from './update-password-action';

const updatePassword = vi.fn();

vi.mock('@api', () => ({
  getApi: async () => ({ authApi: { updatePassword } }),
}));

describe('updatePasswordAction', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updatePassword.mockResolvedValue({ success: true });
  });

  it('updates the password', async () => {
    const result = await updatePasswordAction('new-secret');

    expect(result).toEqual({ success: true });
    expect(updatePassword).toHaveBeenCalledWith('new-secret');
  });

  it('rejects a password shorter than 8 characters, like sign-up', async () => {
    const result = await updatePasswordAction('1234567');

    expect(result).toEqual({ success: false, error: 'common_error_invalid_request' });
    expect(updatePassword).not.toHaveBeenCalled();
  });

  it('returns the domain error code, e.g. same password', async () => {
    updatePassword.mockRejectedValue(new AppError('auth_error_update_password_same'));

    const result = await updatePasswordAction('new-secret');

    expect(result).toEqual({ success: false, error: 'auth_error_update_password_same' });
  });
});

import { describe, expect, it, vi } from 'vitest';

import { setServerError } from './form-errors';

describe('setServerError', () => {
  it('põe o erro no campo a que ele pertence e foca o campo', () => {
    const setError = vi.fn();

    setServerError(setError, ['email', 'password'], 'auth_error_signup_duplicate_email', 'In use');

    expect(setError).toHaveBeenCalledWith('email', { message: 'In use' }, { shouldFocus: true });
  });

  it('sem campo correspondente no formulário, vai para o topo', () => {
    const setError = vi.fn();

    setServerError(setError, ['email'], 'auth_error_update_password_weak', 'Weak');
    setServerError(setError, ['email'], 'auth_error_rate_limited', 'Wait');
    setServerError(setError, ['email'], null, 'Oops');

    expect(setError.mock.calls.map(([field]) => field)).toEqual(['root', 'root', 'root']);
  });
});

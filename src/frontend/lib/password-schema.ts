// zod/mini: the forms ship to the browser, and the full zod is ~30 KB gzip more
import { z } from 'zod/mini';

import {
  MAX_PASSWORD_LENGTH,
  MIN_PASSWORD_LENGTH,
  fitsPasswordBytes,
} from '@shared/auth/password-policy';

/** next-intl translator scoped to `common`. */
type CommonTranslator = (
  key: 'passwordMinLength' | 'passwordTooLong' | 'passwordsDoNotMatch',
  values?: { min: number },
) => string;

/** `password` + `confirmPassword` fields for forms where the user picks a new password. */
export function newPasswordFields(t: CommonTranslator) {
  return {
    password: z
      .string()
      .check(
        z.minLength(MIN_PASSWORD_LENGTH, t('passwordMinLength', { min: MIN_PASSWORD_LENGTH })),
        z.maxLength(MAX_PASSWORD_LENGTH, t('passwordTooLong')),
        z.refine(fitsPasswordBytes, t('passwordTooLong')),
      ),
    confirmPassword: z.string(),
  };
}

/** Check for `.check(...)`: the confirmation must repeat the password. */
export function passwordsMustMatch(t: CommonTranslator) {
  return z.refine<{ password: string; confirmPassword: string }>(
    (data) => data.password === data.confirmPassword,
    {
      error: t('passwordsDoNotMatch'),
      path: ['confirmPassword'],
    },
  );
}

export function newPasswordSchema(t: CommonTranslator) {
  return z.object(newPasswordFields(t)).check(passwordsMustMatch(t));
}

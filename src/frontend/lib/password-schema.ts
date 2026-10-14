import { z } from 'zod';

import { MAX_PASSWORD_LENGTH, MIN_PASSWORD_LENGTH } from '@shared/auth/password-policy';

/** next-intl translator scoped to `common`. */
type CommonTranslator = (
  key: 'passwordMinLength' | 'passwordsDoNotMatch',
  values?: { min: number },
) => string;

/** `password` + `confirmPassword` fields for forms where the user picks a new password. */
export function newPasswordFields(t: CommonTranslator) {
  return {
    password: z
      .string()
      .min(MIN_PASSWORD_LENGTH, { message: t('passwordMinLength', { min: MIN_PASSWORD_LENGTH }) })
      .max(MAX_PASSWORD_LENGTH),
    confirmPassword: z.string(),
  };
}

/** Arguments for `.refine(...)`: the confirmation must repeat the password. */
export function passwordsMustMatch(
  t: CommonTranslator,
): [(data: { password: string; confirmPassword: string }) => boolean, z.core.$ZodCustomParams] {
  return [
    (data) => data.password === data.confirmPassword,
    { message: t('passwordsDoNotMatch'), path: ['confirmPassword'] },
  ];
}

export function newPasswordSchema(t: CommonTranslator) {
  return z.object(newPasswordFields(t)).refine(...passwordsMustMatch(t));
}

import { useTranslations } from 'next-intl';

export function useErrorMessage() {
  const t = useTranslations('common');

  const getMessage = (errorCode: string | null | undefined): string => {
    if (!errorCode) return t('errors.unknown');

    // Remove any context prefix if needed (though our keys match exactly)
    // The keys in pt.json are like "auth_error_signup_duplicate_email"
    // and our error codes are exactly the same.

    if (t.has(`errors.${errorCode}`)) {
      return t(`errors.${errorCode}`);
    }

    // Default fallback to the code itself if translation is missing
    return errorCode;
  };

  return { getMessage };
}

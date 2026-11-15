import { getTranslations } from 'next-intl/server';

import { AppToasterClient } from './AppToasterClient';

/**
 * The app's toasts, named in the page's language: the root layout renders them outside the
 * client translations (Providers), and Sonner's default name was always "Notifications".
 */
export async function AppToaster() {
  const t = await getTranslations('common');
  return <AppToasterClient label={t('notifications')} />;
}

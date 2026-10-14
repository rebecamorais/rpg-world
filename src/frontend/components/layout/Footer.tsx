import { getApi } from '@api';

import FooterContent from './FooterContent';

/** Server side of the footer: knows whether there is a session, so the links match it. */
export default async function Footer() {
  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return <FooterContent isAuthenticated={!!user} />;
}

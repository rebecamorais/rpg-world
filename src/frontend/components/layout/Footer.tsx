import { getApi } from '@api';

import FooterContent from './FooterContent';

/**
 * `session="server"`: knows from the server whether there is a session, so the links match it.
 * `session="client"` (prebuilt pages): reads nothing from the request; the browser decides.
 */
export default async function Footer({ session }: { session: 'server' | 'client' }) {
  if (session === 'client') return <FooterContent />;

  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  return <FooterContent serverUser={user} />;
}

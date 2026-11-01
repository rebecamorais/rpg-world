import { getApi } from '@api';

import FooterContent from './FooterContent';

/**
 * `session="server"` (the app's pages): the compact footer, with the session from the server.
 * `session="client"` (prebuilt pages): reads nothing from the request; the browser decides.
 */
export default async function Footer({ session }: { session: 'server' | 'client' }) {
  if (session === 'client') return <FooterContent />;

  const { authApi } = await getApi();
  const user = await authApi.getSessionUser();

  // Signed-in pages are the app: a one-line footer instead of the site's
  return <FooterContent serverUser={user} compact />;
}

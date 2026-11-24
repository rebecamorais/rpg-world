import { notFound } from 'next/navigation';

/**
 * Any URL no page matches. Without it, Next answers with app/global-not-found.tsx, outside every
 * layout: no header, and no sidebar for whoever is signed in. Here the 404 is (app)/not-found.tsx,
 * with the site's header and, signed in, the app's sidebar.
 */
export default function UnmatchedPage(): never {
  notFound();
}

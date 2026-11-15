import { redirect } from 'next/navigation';

/** "Settings" is what the footer calls the profile page; a typed /settings lands there, not on a 404. */
export default function SettingsPage() {
  redirect('/settings/profile');
}

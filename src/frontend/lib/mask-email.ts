/**
 * An e-mail with all but the first letter of its name hidden (`c***@email.com`): enough to tell
 * which account a page is about, without showing the whole address on screen.
 */
export function maskEmail(email: string): string {
  const at = email.lastIndexOf('@');
  if (at < 1) return email;
  return `${email[0]}***${email.slice(at)}`;
}

import { DEMO_PARTY_ID } from './ids';

const REGISTER = '/register';
const PARTY = `/parties/${DEMO_PARTY_ID}`;

/** Where a link of the real app goes inside the demo: its twin under /demo, or the sign-up page. */
export function toDemoHref(href: string): string {
  if (!href.startsWith('/') || href.startsWith('/demo')) return href;
  const [path] = href.split(/[?#]/);

  if (path === '/parties' || path === '/characters' || path === PARTY) return '/demo';
  if (path === '/characters/npcs') return '/demo/npcs';
  if (path.startsWith(`${PARTY}/settings`)) return REGISTER;

  const sheet = /^\/(?:parties\/[^/]+|system\/[^/]+)\/characters?\/([^/]+)(\/.*)?$/.exec(path);
  if (sheet) return `/demo/characters/${sheet[1]}${sheet[2] ?? ''}`;

  const inside = /^\/parties\/[^/]+(\/(?:inventory|chest))$/.exec(path);
  if (inside) return `/demo${inside[1]}`;

  return REGISTER;
}

import type { User } from '@shared/types/user';

export const DEMO_PARTY_ID = 'the-pioneers';

/** The username every demo sheet shows as its owner. */
export const DEMO_OWNER = 'the_pioneers';

/** Nobody is signed in: this is only the shape the screens expect for "the person looking". */
export const DEMO_USER: User = { id: 'demo-visitor' };

export const DEMO_GM_ID = 'demo-gm';

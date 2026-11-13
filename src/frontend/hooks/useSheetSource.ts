import { createContext, useContext } from 'react';

import { useParams } from 'next/navigation';

import { useDemo } from '@frontend/demo/DemoContext';
import { DEMO_PARTY_ID } from '@frontend/demo/ids';

export interface SheetSource {
  /** The GM of a party reading a sheet brought to it: nothing on the sheet can be changed. */
  readOnly: boolean;
  partyId: string | null;
  /** Where the sheet's data is read from. */
  apiPath: string;
  /** The sheet's tabs live under this path. */
  pagesPath: string;
  /**
   * Shown inside another page (the party's sheet viewer) rather than as its own page: no page
   * title, no tab bar, no fixed bars of its own.
   */
  embedded?: boolean;
}

/**
 * Where a sheet shown outside its own route reads from (the party's sheet viewer): set by the
 * viewer, it wins over the route, so the sheet's components need no change.
 */
export const SheetSourceContext = createContext<SheetSource | null>(null);

/**
 * Whose sheet this route shows. Under /parties/<partyId>/characters/<id> it is the GM's read-only
 * view of a player's sheet; anywhere else, the owner's own sheet. Inside a SheetSourceContext
 * (the party's sheet viewer), whatever it says.
 */
export function useSheetSource(characterId: string, system?: string): SheetSource {
  const params = useParams();
  const { isDemo } = useDemo();
  const embedded = useContext(SheetSourceContext);

  if (embedded) return embedded;

  if (isDemo) {
    return {
      readOnly: true,
      partyId: DEMO_PARTY_ID,
      apiPath: `/api/parties/${DEMO_PARTY_ID}/characters/${characterId}`,
      pagesPath: `/demo/characters/${characterId}`,
    };
  }

  const partyId = typeof params?.partyId === 'string' ? params.partyId : null;

  if (partyId) {
    const path = `/parties/${partyId}/characters/${characterId}`;
    return { readOnly: true, partyId, apiPath: `/api${path}`, pagesPath: path };
  }

  return {
    readOnly: false,
    partyId: null,
    apiPath: `/api/characters/${characterId}`,
    pagesPath: `/system/${system}/character/${characterId}`,
  };
}

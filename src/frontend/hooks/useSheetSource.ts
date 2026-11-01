import { useParams } from 'next/navigation';

export interface SheetSource {
  /** The GM of a party reading a sheet brought to it: nothing on the sheet can be changed. */
  readOnly: boolean;
  partyId: string | null;
  /** Where the sheet's data is read from. */
  apiPath: string;
  /** The sheet's tabs live under this path. */
  pagesPath: string;
}

/**
 * Whose sheet this route shows. Under /parties/<partyId>/characters/<id> it is the GM's read-only
 * view of a player's sheet; anywhere else, the owner's own sheet.
 */
export function useSheetSource(characterId: string, system?: string): SheetSource {
  const params = useParams();
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

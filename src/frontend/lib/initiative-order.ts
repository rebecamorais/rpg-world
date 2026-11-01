/**
 * The order "Sort by initiative" saves: highest first, ties keep their current order, and whoever
 * has no initiative yet goes last. The GM then adjusts with up/down.
 */
export function sortByInitiative(
  rows: { participantId: string; initiative: number | null }[],
): string[] {
  return rows
    .map((row, index) => ({ ...row, index }))
    .sort((a, b) => {
      if (a.initiative === null || b.initiative === null) {
        return (
          (a.initiative === null ? 1 : 0) - (b.initiative === null ? 1 : 0) || a.index - b.index
        );
      }
      return b.initiative - a.initiative || a.index - b.index;
    })
    .map((row) => row.participantId);
}

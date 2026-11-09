type Ordered = { participantId: string; initiative: number | null };

/**
 * The order "Sort by initiative" saves: highest first, ties keep their current order, and whoever
 * has no initiative yet goes last. An exact tie the GM settles with "Swap with" (`tiedNeighbors`).
 */
export function sortByInitiative(rows: Ordered[]): string[] {
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

/** Whether the list is in the order "Sort by initiative" would save: false once someone's changed. */
export function isSortedByInitiative(rows: Ordered[]): boolean {
  return sortByInitiative(rows).every((id, index) => id === rows[index].participantId);
}

/** The rows right above and below `index` with exactly the same initiative; none without one. */
export function tiedNeighbors<Row extends Ordered>(
  rows: Row[],
  index: number,
): { above?: Row; below?: Row } {
  const initiative = rows[index]?.initiative ?? null;
  const tied = (row: Row | undefined) =>
    initiative !== null && row?.initiative === initiative ? row : undefined;
  return { above: tied(rows[index - 1]), below: tied(rows[index + 1]) };
}

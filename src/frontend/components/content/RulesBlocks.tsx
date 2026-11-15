import { RulesText } from '@frontend/components/content/RulesText';

type Block =
  | { kind: 'paragraph'; text: string }
  | { kind: 'rows'; caption: string | null; header: string[]; rows: string[][] };

const CELL_SEPARATOR = ' | ';
const isRow = (line: string) => line.includes(CELL_SEPARATOR);
const cells = (line: string) => line.split(CELL_SEPARATOR).map((cell) => cell.trim());

/**
 * Splits rules text (one paragraph per line, as the importers write it) into paragraphs and tables.
 * A table is a run of `a | b | c` lines, the first one its header; the line right before it, when
 * it is short and has no sentence end, is its caption ("Beast Shapes").
 */
export function rulesBlocks(text: string): Block[] {
  const blocks: Block[] = [];
  const lines = text.split('\n').filter((line) => line.trim());
  for (let i = 0; i < lines.length; i++) {
    if (!isRow(lines[i]) || !lines[i + 1] || !isRow(lines[i + 1])) {
      blocks.push({ kind: 'paragraph', text: lines[i] });
      continue;
    }
    const previous = blocks.at(-1);
    const caption =
      previous?.kind === 'paragraph' && previous.text.length <= 60 && !/[.:!?]$/.test(previous.text)
        ? (blocks.pop(), previous.text)
        : null;
    const header = cells(lines[i]);
    const rows: string[][] = [];
    while (lines[i + 1] && isRow(lines[i + 1])) rows.push(cells(lines[++i]));
    blocks.push({ kind: 'rows', caption, header, rows });
  }
  return blocks;
}

/**
 * Rules text as paragraphs and tables, with its tags shown the way `RulesText` shows them.
 * `nested`: already inside a popover, so tags stay plain text (see `RulesText`).
 */
export function RulesBlocks({
  text,
  source,
  nested = false,
}: {
  text: string;
  source: string;
  nested?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2">
      {rulesBlocks(text).map((block, i) =>
        block.kind === 'paragraph' ? (
          <p key={i}>
            <RulesText text={block.text} source={source} nested={nested} />
          </p>
        ) : (
          <div key={i} className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              {block.caption && (
                <caption className="text-foreground mb-1 text-left font-semibold">
                  {block.caption}
                </caption>
              )}
              <thead>
                <tr className="border-border border-b">
                  {block.header.map((cell, c) => (
                    <th key={c} scope="col" className="text-foreground py-1 pr-3 font-semibold">
                      <RulesText text={cell} source={source} nested={nested} />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, r) => (
                  <tr key={r} className="border-border border-b last:border-0">
                    {row.map((cell, c) => (
                      <td key={c} className="py-1 pr-3 align-top">
                        <RulesText text={cell} source={source} nested={nested} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ),
      )}
    </div>
  );
}

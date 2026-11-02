'use client';

import * as React from 'react';

import { ConditionHint } from '@frontend/components/content/ConditionHint';
import { ItemHint } from '@frontend/components/content/ItemHint';
import { useConditions } from '@frontend/hooks/useConditions';
import { useItems } from '@frontend/hooks/useItems';

import { conditionKey, contentIdFromName, itemKey } from '@shared/content/content-key';
import { parseTags } from '@shared/content/tags';

interface RulesTextProps {
  text: string;
  /** The book the text comes from: `{@condition x}` points to the condition of that same book. */
  source: string;
  /** Inside a condition's or item's own popover: conditions and items stay plain text, so it never nests. */
  nested?: boolean;
}

/** Rules text with its tags: conditions are buttons, any other tag shows as plain text. */
export function RulesText({ text, source, nested = false }: RulesTextProps) {
  const { byKey } = useConditions();
  const { byKey: itemsByKey } = useItems();

  return (
    <>
      {parseTags(text).map((node, i) => {
        if (node.kind === 'tag' && node.tag === 'condition' && !nested) {
          const key = conditionKey(source, node.target);
          if (byKey.has(key)) {
            return <ConditionHint key={i} conditionKey={key} label={node.text} />;
          }
        }
        if (node.kind === 'tag' && node.tag === 'item' && !nested) {
          // The tag holds the item's English name; the id is its slug, in the book being read.
          // Without a display part the button shows the item's name in the screen's language.
          const key = itemKey(source, contentIdFromName(node.target));
          if (itemsByKey.has(key)) {
            return <ItemHint key={i} itemKey={key} label={node.display ?? undefined} />;
          }
        }
        return <React.Fragment key={i}>{node.text}</React.Fragment>;
      })}
    </>
  );
}

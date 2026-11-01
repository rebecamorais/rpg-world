'use client';

import * as React from 'react';

import { ConditionHint } from '@frontend/components/content/ConditionHint';
import { useConditions } from '@frontend/hooks/useConditions';

import { conditionKey } from '@shared/content/content-key';
import { parseTags } from '@shared/content/tags';

interface RulesTextProps {
  text: string;
  /** The book the text comes from: `{@condition x}` points to the condition of that same book. */
  source: string;
  /** Inside a condition's own popover: conditions stay plain text, so it never nests. */
  nested?: boolean;
}

/** Rules text with its tags: conditions are buttons, any other tag shows as plain text. */
export function RulesText({ text, source, nested = false }: RulesTextProps) {
  const { byKey } = useConditions();

  return (
    <>
      {parseTags(text).map((node, i) => {
        if (node.kind === 'tag' && node.tag === 'condition' && !nested) {
          const key = conditionKey(source, node.target);
          if (byKey.has(key)) {
            return <ConditionHint key={i} conditionKey={key} label={node.text} />;
          }
        }
        return <React.Fragment key={i}>{node.text}</React.Fragment>;
      })}
    </>
  );
}

/**
 * The short names of the classes (class, subclass title, features, resources, choices,
 * subclasses), translated from a Foundry module's NameIndex. Long texts are left out.
 */
import type { z } from 'zod';

import type { classTextSchema } from '@shared/systems/dnd5e/content/class.schema';

import type { NameIndex } from './foundry-names';

type ClassText = z.infer<typeof classTextSchema>;

/** A translated texts file, or part of one: any field may be missing. */
export type TextTree = { [key: string]: string | TextTree | undefined };

export type NamesReport = { translated: number; missing: string[]; ambiguous: string[] };

const isTree = (value: unknown): value is TextTree => typeof value === 'object' && value !== null;

function setIn(tree: TextTree, path: string[], value: string) {
  let node = tree;
  for (const key of path.slice(0, -1)) {
    const next = node[key];
    node = isTree(next) ? next : (node[key] = {});
  }
  node[path[path.length - 1]] = value;
}

function getIn(tree: TextTree, path: string[]): unknown {
  let node: unknown = tree;
  for (const key of path) node = isTree(node) ? node[key] : undefined;
  return node;
}

/**
 * Fills the names `existing` lacks (missing or "", as Crowdin exports untranslated texts).
 * The result holds only the new names; `report` lists, by path, what had no match.
 */
export function translateClassNames(
  en: Record<string, ClassText>,
  existing: TextTree,
  index: NameIndex,
): { translation: Record<string, TextTree>; report: NamesReport } {
  const translation: Record<string, TextTree> = {};
  const report: NamesReport = { translated: 0, missing: [], ambiguous: [] };

  const name = (path: string[], enName: string, context: string[]) => {
    if (getIn(existing, path)) return;
    const value = index.get(enName, context);
    if (value) {
      setIn(translation, path, value);
      report.translated++;
    } else {
      (index.ambiguous.has(enName) ? report.ambiguous : report.missing).push(path.join('.'));
    }
  };
  const named = (path: string[], items: Record<string, { name: string }>, context: string[]) => {
    for (const [id, item] of Object.entries(items)) name([...path, id, 'name'], item.name, context);
  };

  for (const [classId, text] of Object.entries(en)) {
    const context = [text.name];
    name([classId, 'name'], text.name, context);
    name([classId, 'subclassTitle'], text.subclassTitle, context);
    named([classId, 'features'], text.features, context);
    named([classId, 'resources'], text.resources, context);
    named([classId, 'choices'], text.choices, context);
    for (const [subId, sub] of Object.entries(text.subclasses)) {
      const path = [classId, 'subclasses', subId];
      const subContext = [sub.name, text.name];
      name([...path, 'name'], sub.name, context);
      named([...path, 'features'], sub.features, subContext);
      named([...path, 'resources'], sub.resources, subContext);
    }
  }
  return { translation, report };
}

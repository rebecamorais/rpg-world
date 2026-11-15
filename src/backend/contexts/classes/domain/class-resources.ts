import type { ClassContent } from '@shared/systems/dnd5e/class-resources';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

export interface ClassCatalog {
  /** One class and its SRD subclass in one locale: the rules data by id, feature names and the resources' texts; null if the book lacks the class. */
  resources(edition: Edition, classId: string, locale?: string): ClassContent | null;
}

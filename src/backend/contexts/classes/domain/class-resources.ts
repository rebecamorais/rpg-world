import type { ClassResourcesContent } from '@shared/systems/dnd5e/class-resources';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

export interface ClassCatalog {
  /** One class and its SRD subclass with only the resources' texts, in one locale; null if the book lacks the class. */
  resources(edition: Edition, classId: string, locale?: string): ClassResourcesContent | null;
}

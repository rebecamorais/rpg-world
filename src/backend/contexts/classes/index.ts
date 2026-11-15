import type { Edition } from '@shared/systems/dnd5e/content/editions';

import type { ClassCatalog } from './domain/class-resources';
import { getClassCatalog } from './infrastructure/srd-classes';

export class ClassesContext {
  constructor(readonly catalog: ClassCatalog) {}

  resources(edition: Edition, classId: string, locale?: string) {
    return this.catalog.resources(edition, classId, locale);
  }
}

export function createClassesContext() {
  return new ClassesContext(getClassCatalog());
}

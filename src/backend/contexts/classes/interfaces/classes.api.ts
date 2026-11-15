import { AppError } from '@backend/shared/domain/AppError';

import type { Edition } from '@shared/systems/dnd5e/content/editions';

import type { ClassesContext } from '../index';

export const makeClassesApi = (classesContext: ClassesContext) => ({
  resources: (edition: Edition, classId: string, locale?: string) => {
    const content = classesContext.resources(edition, classId, locale);
    if (!content) throw new AppError('class_error_not_found', 'not_found');
    return content;
  },
});

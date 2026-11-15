import type { ClassResourcesContent, ResourceContent } from '@shared/systems/dnd5e/class-resources';
import type {
  ClassData,
  ClassResource,
  ClassText,
  ClassTranslation,
} from '@shared/systems/dnd5e/content/class.schema';
import type { Edition } from '@shared/systems/dnd5e/content/editions';

import type { ClassCatalog } from '../domain/class-resources';

/** The classes of one book: rules data, English texts and translations by locale. */
export interface ClassSource {
  edition: Edition;
  classes: ClassData[];
  texts: Record<string, ClassText>;
  translations: Record<string, Record<string, ClassTranslation>>;
}

type FeatureTexts = Record<string, { name?: string; description?: string }>;
type ResourceTexts = Record<string, { name?: string; note?: string }>;

const FALLBACK_LOCALE = 'en';

/** The first non-empty text: the locale's, then English. */
const pick = (...values: (string | undefined)[]) => values.find((value) => value);

/** Official classes, read from the content files and kept in memory. */
export class FileClassCatalog implements ClassCatalog {
  private readonly byEdition: Map<Edition, ClassSource>;

  constructor(sources: ClassSource[]) {
    this.byEdition = new Map(sources.map((source) => [source.edition, source]));
  }

  resources(
    edition: Edition,
    classId: string,
    requestedLocale?: string,
  ): ClassResourcesContent | null {
    const source = this.byEdition.get(edition);
    const data = source?.classes.find((c) => c.id === classId);
    const text = source?.texts[classId];
    if (!source || !data || !text) return null;
    const subclass = data.subclasses[0];
    const subclassText = text.subclasses[subclass.id];
    if (!subclassText) return null;

    const locale =
      requestedLocale && Object.hasOwn(source.translations, requestedLocale)
        ? requestedLocale
        : FALLBACK_LOCALE;
    const translation = source.translations[locale]?.[classId];
    const subTranslation = translation?.subclasses?.[subclass.id];

    const build = (
      resources: ClassResource[],
      features: FeatureTexts,
      resourceTexts: ResourceTexts,
      localFeatures: FeatureTexts | undefined,
      localResources: ResourceTexts | undefined,
    ): ResourceContent[] =>
      resources.map((resource) => {
        const name = pick(localResources?.[resource.id]?.name, resourceTexts[resource.id]?.name);
        const note = pick(localResources?.[resource.id]?.note, resourceTexts[resource.id]?.note);
        const localDescription = localFeatures?.[resource.feature]?.description;
        const description = pick(localDescription, features[resource.feature]?.description) ?? '';
        // The rules text fell back to English: the sheet says so and marks its language
        const untranslated = locale !== FALLBACK_LOCALE && !localDescription && !!description;
        return {
          ...resource,
          name: name ?? resource.id,
          ...(note ? { note } : {}),
          description,
          ...(untranslated && { untranslated: true }),
        };
      });

    const subclassNames = [subclassText.name];
    const localName = subTranslation?.name;
    if (localName && localName !== subclassText.name) subclassNames.push(localName);

    return {
      classId,
      edition,
      hitDie: data.hitDie,
      resources: build(
        data.resources,
        text.features,
        text.resources,
        translation?.features,
        translation?.resources,
      ),
      subclass: {
        id: subclass.id,
        names: subclassNames,
        resources: build(
          subclass.resources,
          subclassText.features,
          subclassText.resources,
          subTranslation?.features,
          subTranslation?.resources,
        ),
      },
    };
  }
}

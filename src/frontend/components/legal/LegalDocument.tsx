import type { ReactNode } from 'react';

export type LegalSection = { id: string; title: string; body: ReactNode };

type LegalDocumentProps = {
  title: string;
  lastUpdated: string;
  /** Name of the index at the top ("On this page"). */
  tocLabel: string;
  sections: LegalSection[];
};

/** A paragraph of a legal page: body text in the foreground color, so it reads as the content. */
export function LegalParagraph({ children }: { children: ReactNode }) {
  return <p className="text-body text-foreground">{children}</p>;
}

/** A bulleted list of a legal page. */
export function LegalList({ items }: { items: ReactNode[] }) {
  return (
    <ul className="text-body text-foreground marker:text-muted-foreground flex list-disc flex-col gap-2 pl-6">
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

/**
 * The privacy policy and the terms: title, date, an index of the sections and the sections. No
 * "Back": the header and the footer already lead home.
 */
export function LegalDocument({ title, lastUpdated, tocLabel, sections }: LegalDocumentProps) {
  return (
    <article className="container mx-auto flex max-w-3xl flex-1 flex-col gap-10 px-4 py-16 sm:py-20">
      <header className="flex flex-col gap-2">
        <h1 className="text-display">{title}</h1>
        <p className="text-caption text-muted-foreground">{lastUpdated}</p>
      </header>

      <nav aria-labelledby="legal-toc" className="border-border rounded-lg border p-4 sm:p-6">
        <h2 id="legal-toc" className="text-label text-muted-foreground mb-3">
          {tocLabel}
        </h2>
        <ol className="flex flex-col gap-1">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                className="text-body text-primary-flare hover:text-foreground focus-ring touch-target inline-block rounded-sm underline-offset-4 hover:underline"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-title`}
          className="flex scroll-mt-6 flex-col gap-4"
        >
          <h2 id={`${section.id}-title`} className="text-title">
            {section.title}
          </h2>
          {section.body}
        </section>
      ))}
    </article>
  );
}

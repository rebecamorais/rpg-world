/**
 * The art behind a sheet, with a scrim so what sits directly on the page (title, labels) stays
 * readable over any image; the panels are solid. It fills the nearest positioned parent and keeps
 * one screen of art in view while a long page scrolls, instead of stretching along with the page.
 * An `<img>` rather than a CSS `url()`: the address is the player's own text, and the GM's browser
 * loads it too.
 */
export function SheetBackdrop({ url }: { url: string }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-clip">
      {/* eslint-disable-next-line @next/next/no-img-element -- an uploaded image, any aspect */}
      <img src={url} alt="" className="sticky top-0 h-screen max-h-full w-full object-cover" />
      <div className="bg-background/85 absolute inset-0" />
    </div>
  );
}

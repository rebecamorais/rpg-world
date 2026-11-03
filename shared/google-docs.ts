const DOC_ID = /^[A-Za-z0-9_-]{20,100}$/;
const DOC_URL =
  /^(?:https?:\/\/)?docs\.google\.com\/document\/(?:u\/\d+\/)?d\/([A-Za-z0-9_-]{20,100})(?:[/?#]|$)/;

/** The document ID from a Google Docs link (or the bare ID); null for anything else. */
export function parseGoogleDocId(input: string): string | null {
  const text = input.trim();
  if (DOC_ID.test(text)) return text;
  return DOC_URL.exec(text)?.[1] ?? null;
}

export function googleDocUrl(docId: string): string {
  return `https://docs.google.com/document/d/${docId}/edit`;
}

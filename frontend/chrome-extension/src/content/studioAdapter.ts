export type StudioVideoMetadata = {
  title?: string;
  description?: string;
  tags?: string[];
};

function readAnyText(el: Element | null): string | undefined {
  if (!el) return undefined;

  // input / textarea
  const asInput = el as HTMLInputElement | HTMLTextAreaElement;
  if (typeof asInput.value === "string" && asInput.value.trim()) return asInput.value.trim();

  // contenteditable
  const asHtml = el as HTMLElement;
  if (asHtml.isContentEditable) {
    const t = asHtml.innerText?.trim();
    if (t) return t;
  }

  // fallback
  const t = (el as HTMLElement).textContent?.trim();
  return t || undefined;
}

function pickFirst(selectors: string[]): Element | null {
  for (const s of selectors) {
    const el = document.querySelector(s);
    if (el) return el;
  }
  return null;
}

export function extractStudioMetadata(): StudioVideoMetadata {
  // YouTube Studio uses different internal components over time.
  // We try a few “likely” selectors and fall back to aria-label heuristics.

  const titleEl = pickFirst([
    // common case: textarea with aria-label Title
    'textarea[aria-label*="title" i]',
    'input[aria-label*="title" i]',
    // sometimes a contenteditable region
    '[contenteditable="true"][aria-label*="title" i]',
    // fallback: any element with aria-label containing "title"
    '[aria-label*="title" i]'
  ]);

  const descEl = pickFirst([
    'textarea[aria-label*="description" i]',
    '[contenteditable="true"][aria-label*="description" i]',
    '[aria-label*="description" i]'
  ]);

  // Tags are tricky: often chips/tokens.
  // We try to find “chips” within a tags section first; then fallback to any chip-like items.
  const tagsContainer = pickFirst([
    '[aria-label*="tags" i]',
    '[label*="Tags" i]',
    '[data-field*="tags" i]'
  ]);

  const tagCandidates = Array.from(
    (tagsContainer ?? document).querySelectorAll(
      // list items / chips / pills
      '[role="listitem"], yt-chip-cloud-chip, .chip, .pill, [class*="chip" i], [class*="pill" i]'
    )
  )
    .map((n) => (n as HTMLElement).innerText?.trim())
    .filter((t): t is string => !!t && t.length > 0);

  // de-dupe
  const tags = Array.from(new Set(tagCandidates)).slice(0, 50);

  return {
    title: readAnyText(titleEl),
    description: readAnyText(descEl),
    tags: tags.length ? tags : undefined
  };
}

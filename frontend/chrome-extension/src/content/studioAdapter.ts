export type StudioVideoMetadata = {
  videoId?: string;
  title?: string;
  description?: string;
  tags?: string[];
  durationSeconds?: number;
};

function getVideoIdFromUrl(): string | undefined {
  const m = window.location.pathname.match(/\/video\/([^/]+)\//);
  return m?.[1];
}

function parseTimeToSeconds(t: string): number | null {
  const parts = t.trim().split(":").map(Number);
  if (parts.some((n) => Number.isNaN(n) || n < 0)) return null;

  if (parts.length === 2) {
    const [mm, ss] = parts;
    if (ss >= 60) return null;
    return mm * 60 + ss;
  }
  if (parts.length === 3) {
    const [hh, mm, ss] = parts;
    if (mm >= 60 || ss >= 60) return null;
    return hh * 3600 + mm * 60 + ss;
  }
  return null;
}


function deepQueryAll(selector: string): Element[] {
  const out: Element[] = [];

  const visit = (node: Node) => {
    if (node instanceof Element) {
      out.push(...Array.from(node.querySelectorAll(selector)));
      const any = node as any;
      if (any.shadowRoot) visit(any.shadowRoot as ShadowRoot);
    }
    (node as any).childNodes?.forEach?.(visit);
  };

  visit(document.documentElement);
  return out;
}

function deepPickFirst(selectors: string[]): Element | null {
  for (const s of selectors) {
    const hit = deepQueryAll(s)[0];
    if (hit) return hit;
  }
  return null;
}

function readAnyText(el: Element | null): string | undefined {
  if (!el) return undefined;

  const asInput = el as HTMLInputElement | HTMLTextAreaElement;
  if (typeof (asInput as any).value === "string") {
    const v = (asInput as any).value.trim();
    if (v) return v;
  }

  const asHtml = el as HTMLElement;
  if (asHtml.isContentEditable) {
    const t = asHtml.innerText?.trim();
    if (t) return t;
  }

  const t = (el as HTMLElement).textContent?.trim();
  return t || undefined;
}

function getDurationSeconds(): number | undefined {
  const v = document.querySelector("video") as HTMLVideoElement | null;
  if (v && Number.isFinite(v.duration) && v.duration > 0) {
    return Math.round(v.duration);
  }

  const previewRoot =
    document.querySelector("ytcp-video-preview") ||
    document.querySelector("ytcp-video-preview-player") ||
    document.body;

  const text = previewRoot?.textContent || "";

  const m = text.match(/\b(\d{1,2}:\d{2}(?::\d{2})?)\s*\/\s*(\d{1,2}:\d{2}(?::\d{2})?)\b/);
  if (m) {
    const total = parseTimeToSeconds(m[2]);
    if (total != null && total > 0) return total;
  }

  const times = Array.from(text.matchAll(/\b(\d{1,2}:\d{2}(?::\d{2})?)\b/g)).map((x) => x[1]);
  let best = 0;
  for (const t of times) {
    const s = parseTimeToSeconds(t);
    if (s != null && s > best) best = s;
  }
  if (best > 0) return best;

  return undefined;
}


function pickBestLongTextField(excludeExact?: string): string | undefined {
  const candidates: string[] = [];

  // Prefer textareas + contenteditables (description often one of these)
  const textareas = deepQueryAll("textarea") as HTMLTextAreaElement[];
  for (const ta of textareas) {
    const v = (ta.value || "").trim();
    if (v) candidates.push(v);
  }

  const edits = deepQueryAll('[contenteditable="true"]') as HTMLElement[];
  for (const ed of edits) {
    const v = (ed.innerText || "").trim();
    if (v) candidates.push(v);
  }

  const cleaned = candidates
    .map((t) => t.trim())
    .filter((t) => t.length > 0)
    .filter((t) => (excludeExact ? t !== excludeExact : true));

  if (!cleaned.length) return undefined;

  // Pick the longest (description is typically longer than title)
  cleaned.sort((a, b) => b.length - a.length);
  return cleaned[0];
}

export function extractStudioMetadata(): StudioVideoMetadata {
  const titleEl = deepPickFirst([
    'textarea[aria-label*="title" i]',
    'input[aria-label*="title" i]',
    '[contenteditable="true"][aria-label*="title" i]',
    '[aria-label*="title" i]',
  ]);
  const title = readAnyText(titleEl);

  const descEl = deepPickFirst([
    'textarea[aria-label*="description" i]',
    '[contenteditable="true"][aria-label*="description" i]',
    // common alt wording (varies)
    'textarea[aria-label*="tell viewers" i]',
    '[contenteditable="true"][aria-label*="tell viewers" i]',
  ]);
  let description = readAnyText(descEl);

  if (!description) {
    description = pickBestLongTextField(title);
  }

  const tags: string[] | undefined = undefined;

  return {
    videoId: getVideoIdFromUrl(),
    title,
    description,
    tags,
    durationSeconds: getDurationSeconds(),
  };
}
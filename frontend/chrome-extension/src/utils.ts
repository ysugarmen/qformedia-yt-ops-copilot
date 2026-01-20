export function generateId(): string {
  return crypto.randomUUID();
}

export function getVideoIdFromUrl(): string | undefined {
  const m = window.location.pathname.match(/\/video\/([^/]+)\//);
  return m?.[1];
}
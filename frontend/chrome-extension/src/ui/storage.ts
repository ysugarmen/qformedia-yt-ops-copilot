import type { Settings, Template, ScanRecord } from "./types";

const KEYS = {
  settings: "qfm_settings",
  templates: "qfm_templates",
  history: "qfm_scan_history"
} as const;

// Convert callback API -> Promise
function chromeStorageGet<T>(key: string): Promise<T | undefined> {
    return new Promise((resolve) => {
      chrome.storage.local.get([key], (res: { [key: string]: unknown }) =>
        resolve(res[key] as T | undefined)
      );
    });
  }
  

function chromeStorageSet<T>(key: string, value: T): Promise<void> {
return new Promise((resolve) => {
    chrome.storage.local.set({ [key]: value }, () => resolve());
});
}
  

export async function getSettings(): Promise<Settings> {
  return (await chromeStorageGet<Settings>(KEYS.settings)) ?? {};
}

export async function setSettings(patch: Partial<Settings>) {
  const current = await getSettings();
  await chromeStorageSet(KEYS.settings, { ...current, ...patch });
}

export async function getTemplates(): Promise<Template[]> {
  return (await chromeStorageGet<Template[]>(KEYS.templates)) ?? [];
}

export async function setTemplates(next: Template[]) {
  await chromeStorageSet(KEYS.templates, next);
}

export async function getHistory(): Promise<ScanRecord[]> {
  return (await chromeStorageGet<ScanRecord[]>(KEYS.history)) ?? [];
}

export async function pushHistory(record: ScanRecord) {
  const cur = await getHistory();
  // Keep last 50 scans
  await chromeStorageSet(KEYS.history, [record, ...cur].slice(0, 50));
}

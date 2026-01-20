export type Settings = {
    backendUrl?: string;
    collapsed?: boolean;
  };
  
  
export type ScanRecord = {
    id: string;
    createdAt: string;
    url: string;
    title?: string;
    issues: { key: string; ok: boolean; note?: string | number }[];
};

export type Rule = {
    id: string;
    severity?: "warn" | "error" | string;
    description: string;
};

export type Issue = {
  key: string;
  ok: boolean;
  note?: string;
};
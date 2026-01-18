export type Settings = {
    backendUrl?: string;
    collapsed?: boolean;
  };
  
export type Template = {
    id: string;
    name: string;
    body: string;
};
  
export type ScanRecord = {
    id: string;
    createdAt: string;
    url: string;
    title?: string;
    issues: { key: string; ok: boolean; note?: string | number }[];
};
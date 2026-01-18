import { useMemo, useState } from "react";
import { pushHistory } from "../storage";

type Props = { backendUrl: string };

function uuid() {
    return crypto.randomUUID();
}

export function ScanTab({ backendUrl }: Props) {
    const [status, setStatus] = useState("Idle");
    const [lastResult, setLastResult] = useState<any>(null);

    const checklist = useMemo(() => [
      { key: "title_length", label: "Title present + not too long" },
      { key: "description_present", label: "Description present" },
      { key: "tags_present", label: "Tags present" }
        ], 
        []
    );

    async function runScan() {
        setStatus("Scanning...");

        const meta = await new Promise<any>((resolve) => {
            window.postMessage({ type: "QFM_GET_METADATA" }, "*");
            const onMsg = (event: MessageEvent) => {
                if (event.data?.type === "QFM_METADATA") {
                    window.removeEventListener("message", onMsg);
                    resolve(event.data.payload);
                }
            };
            window.addEventListener("message", onMsg);
        });
        const issues = [
            {
                key: "title_length",
                ok: !!meta.title && meta.title.length <= 100,
                note: meta.title ? `Length: ${meta.title.length}` : "Missing"
            },
            {
                key: "description_present",
                ok: !!meta.description,
                note: meta.description ? "OK" : "Missing"
              },
              {
                key: "tags_present",
                ok: Array.isArray(meta.tags) && meta.tags.length > 0,
                note: meta.tags?.length ?? 0
              }
        ];
        const record = {
            id: uuid(),
            createdAt: new Date().toISOString(),
            url: window.location.href,
            title: meta.title,
            issues
        };

        await pushHistory(record);
        setLastResult({ meta, issues });
        setStatus(`Done (saved to history). Backend: ${backendUrl}`);
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          <button onClick={runScan} style={{ padding: "10px 12px", borderRadius: 10 }}>
            Run Scan
          </button>
    
          <div style={{ fontSize: 12, opacity: 0.8 }}>{status}</div>
    
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {checklist.map((c) => (
              <div key={c.key} style={{ fontSize: 13 }}>
                • {c.label}
              </div>
            ))}
          </div>
    
          {lastResult && (
            <div
              style={{
                fontSize: 12,
                whiteSpace: "pre-wrap",
                border: "1px solid rgba(0,0,0,0.12)",
                padding: 10,
                borderRadius: 10
              }}
            >
              {JSON.stringify(lastResult, null, 2)}
            </div>
          )}
        </div>
    );
}
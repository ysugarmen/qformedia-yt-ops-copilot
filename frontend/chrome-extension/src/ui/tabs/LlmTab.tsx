import { useState } from "react";

type Props = { backendUrl: string };

export function LlmTab({ backendUrl }: Props) {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  async function requestSuggestion(kind: "chapters" | "rewrite_description" | "pinned_comment") {
    setStatus(`Requesting ${kind}…`);

    // Get metadata from the page via content script
    const meta = await new Promise<any>((resolve) => {
      window.postMessage({ type: "QFM_GET_METADATA" }, "*");
      const onMsg = (e: MessageEvent) => {
        if (e.data?.type === "QFM_METADATA") {
          window.removeEventListener("message", onMsg);
          resolve(e.data.payload);
        }
      };
      window.addEventListener("message", onMsg);
    });

    // Backend call (adjust endpoint to match your FastAPI)
    const res = await fetch(`${backendUrl}/llm/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, meta })
    });

    if (!res.ok) {
      setStatus(`Error: ${res.status}`);
      setResult(await res.text());
      return;
    }

    const data = await res.json();
    const text = data?.text ?? JSON.stringify(data, null, 2);

    setResult(text);
    setStatus("Done.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => requestSuggestion("chapters")}>Chapters</button>
        <button onClick={() => requestSuggestion("rewrite_description")}>Rewrite Description</button>
        <button onClick={() => requestSuggestion("pinned_comment")}>Pinned Comment</button>
      </div>

      <div style={{ fontSize: 12, opacity: 0.8 }}>{status}</div>

      <textarea value={result} readOnly rows={12} style={{ width: "100%" }} />

      <div style={{ display: "flex", gap: 8 }}>
        <button onClick={() => navigator.clipboard.writeText(result)} disabled={!result}>
          Copy to clipboard
        </button>
      </div>
    </div>
  );
}

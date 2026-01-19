import { useState } from "react";

type Props = { backendUrl: string };

type SuggestKind = "chapters" | "rewrite_description";

type MetaPayload = Partial<{
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  durationSeconds: number;
}>;

function getVideoIdFromUrl(): string | null {
  // e.g. https://studio.youtube.com/video/3Kox6gWHPK8/edit
  const m = window.location.pathname.match(/\/video\/([^/]+)\//);
  return m?.[1] ?? null;
}

export function LlmTab({ backendUrl }: Props) {
  const [result, setResult] = useState("");
  const [status, setStatus] = useState("");

  async function requestSuggestion(kind: SuggestKind) {
    setStatus(`Requesting ${kind}…`);
    setResult("");

    // Get metadata from the page via content script
    const meta: MetaPayload = await new Promise((resolve) => {
      window.postMessage({ type: "QFM_GET_METADATA" }, "*");

      const onMsg = (e: MessageEvent) => {
        if (e.data?.type === "QFM_METADATA") {
          window.removeEventListener("message", onMsg);
          resolve(e.data.payload ?? {});
        }
      };

      window.addEventListener("message", onMsg);

      setTimeout(() => {
        window.removeEventListener("message", onMsg);
        resolve({});
      }, 2000);
    });

    const videoId = meta.videoId || getVideoIdFromUrl();
    const title = meta.title ?? "";
    const description = meta.description ?? "";
    const tags = Array.isArray(meta.tags) ? meta.tags : [];

    const durationSeconds = 
      typeof meta.durationSeconds === "number" && Number.isFinite(meta.durationSeconds)
       ? Math.max(0, Math.round(meta.durationSeconds))
       : undefined;

    if (!videoId) {
      setStatus("Error: could not determine videoId");
      setResult(
        `Missing videoId. meta.videoId was empty and URL did not match /video/<id>/edit.\n` +
          `Current path: ${window.location.pathname}\n` +
          `meta: ${JSON.stringify(meta, null, 2)}`
      );
      return;
    }

    // Backend call
    const res = await fetch(`${backendUrl}/llm/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        task: kind,
        video: {
          platform: "youtube-studio",
          videoId,
          title,
          description,
          tags,
          ...(durationSeconds != null ? { durationSeconds } : {}),
        },
        styleProfile: null,
      }),
    });

    if (!res.ok) {
      setStatus(`Error: ${res.status}`);
      setResult(await res.text());
      return;
    }

    const data = await res.json();

    const text =
      kind === "rewrite_description"
        ? data?.description ?? JSON.stringify(data, null, 2)
        : kind === "chapters"
          ? JSON.stringify(data?.chapters ?? data, null, 2)
          : JSON.stringify(data, null, 2);

    setResult(text);
    setStatus("Done.");
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button onClick={() => requestSuggestion("chapters")}>Split into Chapters</button>
        <button onClick={() => requestSuggestion("rewrite_description")}>Rewrite Description</button>
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

import { useMemo, useRef, useState } from "react";

type Props = { backendUrl: string };

type SuggestKind = "chapters" | "rewrite_description";

type MetaPayload = Partial<{
  videoId: string;
  title: string;
  description: string;
  tags: string[];
  durationSeconds: number;
}>;

type ChatMsg = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function getVideoIdFromUrl(): string | null {
  // e.g. https://studio.youtube.com/video/3Kox6gWHPK8/edit
  const m = window.location.pathname.match(/\/video\/([^/]+)\//);
  return m?.[1] ?? null;
}

async function getStudioMeta(timeoutMs = 2000): Promise<MetaPayload> {
  return await new Promise((resolve) => {
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
    }, timeoutMs);
  });
}

export function LlmTab({ backendUrl }: Props) {
  const [status, setStatus] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([
    {
      id: uid(),
      role: "assistant",
      content:
        "Use **Rewrite Description** to generate a first draft from your current video title/description.\nThen, tell me what you want to change (sections, tone, extra details, etc.) and I’ll refine it.",
    },
  ]);

  const [currentDraft, setCurrentDraft] = useState<string>("");
  const [input, setInput] = useState<string>("");
  const [busy, setBusy] = useState<boolean>(false);

  const listRef = useRef<HTMLDivElement | null>(null);

  const scrollToBottom = () => {
    // slight delay so DOM updates first
    setTimeout(() => {
      const el = listRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, 0);
  };

  const videoContext = useMemo(() => {
    return async () => {
      const meta = await getStudioMeta();
      const videoId = meta.videoId || getVideoIdFromUrl();
      const title = meta.title ?? "";
      const description = meta.description ?? "";
      const tags = Array.isArray(meta.tags) ? meta.tags : [];

      const durationSeconds =
        typeof meta.durationSeconds === "number" && Number.isFinite(meta.durationSeconds)
          ? Math.max(0, Math.round(meta.durationSeconds))
          : undefined;

      if (!videoId) {
        throw new Error(
          `Missing videoId. meta.videoId was empty and URL did not match /video/<id>/edit.\n` +
            `Current path: ${window.location.pathname}\n` +
            `meta: ${JSON.stringify(meta, null, 2)}`
        );
      }

      return { videoId, title, description, tags, durationSeconds };
    };
  }, []);

  async function callBackend(payload: any) {
    const res = await fetch(`${backendUrl}/llm/suggest`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`HTTP ${res.status}: ${t}`);
    }
    return await res.json();
  }

  async function requestSuggestion(kind: SuggestKind) {
    try {
      setBusy(true);
      setStatus(`Requesting ${kind}…`);

      const vc = await videoContext();

      const data = await callBackend({
        task: kind,
        video: {
          platform: "youtube-studio",
          videoId: vc.videoId,
          title: vc.title,
          description: vc.description,
          tags: vc.tags,
          ...(vc.durationSeconds != null ? { durationSeconds: vc.durationSeconds } : {}),
        },
        styleProfile: null,
      });

      if (kind === "rewrite_description") {
        const draft = (data?.description ?? "").toString();
        setCurrentDraft(draft);

        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: draft || "(No description returned by backend.)",
          },
        ]);
        scrollToBottom();
      } else if (kind === "chapters") {
        const chaptersText = JSON.stringify(data?.chapters ?? data, null, 2);
        setMessages((prev) => [
          ...prev,
          {
            id: uid(),
            role: "assistant",
            content: chaptersText,
          },
        ]);
        scrollToBottom();
      }

      setStatus("Done.");
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `❌ ${e?.message ?? String(e)}` },
      ]);
      scrollToBottom();
    } finally {
      setBusy(false);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || busy) return;

    setInput("");
    setMessages((prev) => [...prev, { id: uid(), role: "user", content: text }]);
    scrollToBottom();

    try {
      setBusy(true);
      setStatus("Refining…");

      const vc = await videoContext();

      const data = await callBackend({
        task: "rewrite_description",
        video: {
          platform: "youtube-studio",
          videoId: vc.videoId,
          title: vc.title,
          description: vc.description,
          tags: vc.tags,
          ...(vc.durationSeconds != null ? { durationSeconds: vc.durationSeconds } : {}),
        },
        styleProfile: null,

        chat: {
          currentDraft: currentDraft || null,
          messages: [
            ...messages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        },
      });

      const nextDraft = (data?.description ?? "").toString();
      setCurrentDraft(nextDraft);

      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: nextDraft || "(No description returned by backend.)" },
      ]);
      scrollToBottom();
      setStatus("Done.");
    } catch (e: any) {
      setStatus(`Error: ${e?.message ?? String(e)}`);
      setMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `❌ ${e?.message ?? String(e)}` },
      ]);
      scrollToBottom();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button className="qfm-btn-secondary" onClick={() => requestSuggestion("chapters")} disabled={busy}>
          Split into Chapters
        </button>
        <button className="qfm-btn-secondary" onClick={() => requestSuggestion("rewrite_description")} disabled={busy}>
          Rewrite Description
        </button>
      </div>

      <div className="qfm-muted">{status}</div>

      {/* Chat thread */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          minHeight: 0,
          overflow: "auto",
          border: "1px solid rgba(0,0,0,0.12)",
          borderRadius: 14,
          padding: 10,
          background: "rgba(0,0,0,0.02)",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {messages.map((m) => {
          const isUser = m.role === "user";
          return (
            <div
              key={m.id}
              style={{
                display: "flex",
                justifyContent: isUser ? "flex-end" : "flex-start",
              }}
            >
              <div
                style={{
                  maxWidth: "92%",
                  whiteSpace: "pre-wrap",
                  borderRadius: 14,
                  padding: "10px 12px",
                  border: "1px solid rgba(0,0,0,0.12)",
                  background: isUser ? "#fff" : "rgba(255,255,255,0.9)",
                }}
              >
                <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6, fontWeight: 700 }}>
                  {isUser ? "You" : "QFM"}
                </div>
                <div style={{ fontSize: 13, lineHeight: 1.35 }}>{m.content}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={2}
          placeholder={
            currentDraft
              ? `Give feedback (e.g. "Add Links/Credits/Disclaimer, mention Champions League…")`
              : `Click "Rewrite Description" first to get a draft, then refine it here…`
          }
          style={{
            flex: 1,
            resize: "none",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.2)",
            padding: "10px 10px",
            fontSize: 13,
          }}
          disabled={busy}
          onKeyDown={(e) => {
            // Enter to send, Shift+Enter for newline
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />

        <button className="qfm-btn-primary" onClick={sendMessage} disabled={busy || !input.trim() || !currentDraft}>
          Send
        </button>
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          className="qfm-btn-secondary"
          onClick={() => navigator.clipboard.writeText(currentDraft)}
          disabled={!currentDraft}
          title="Copies the latest generated description draft"
        >
          Copy draft
        </button>
      </div>
    </div>
  );
}

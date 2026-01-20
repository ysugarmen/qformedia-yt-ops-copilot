import { useMemo, useRef, useState } from "react";

type Props = { backendUrl: string };

type SubTab = "chapters" | "description";

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
  const [subTab, setSubTab] = useState<SubTab>("description");

  // --- Description chat state (separate) ---
  const [descStatus, setDescStatus] = useState("");
  const [descBusy, setDescBusy] = useState(false);
  const [descMessages, setDescMessages] = useState<ChatMsg[]>([]);
  const [descInput, setDescInput] = useState("");
  const [currentDraft, setCurrentDraft] = useState("");

  // --- Chapters tool state (separate) ---
  const [chapStatus, setChapStatus] = useState("");
  const [chapBusy, setChapBusy] = useState(false);
  const [chapResult, setChapResult] = useState("");

  const chatListRef = useRef<HTMLDivElement | null>(null);

  const scrollChatToBottom = () => {
    // slight delay so DOM updates first
    setTimeout(() => {
      const el = chatListRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
    }, 0);
  };

  const getVideoContext = useMemo(() => {
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

  async function generateFirstDescription() {
    try {
      setDescBusy(true);
      setDescStatus("Requesting rewrite_description…");

      const vc = await getVideoContext();

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
      });

      const draft = (data?.description ?? "").toString();
      setCurrentDraft(draft);

      // reset chat for this new draft (clean separation)
      setDescMessages(draft ? [{ id: uid(), role: "assistant", content: draft }] : []);
      scrollChatToBottom();

      setDescStatus("Done.");
    } catch (e: any) {
      setDescStatus(`Error: ${e?.message ?? String(e)}`);
      setDescMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `❌ ${e?.message ?? String(e)}` },
      ]);
      scrollChatToBottom();
    } finally {
      setDescBusy(false);
    }
  }

  async function sendDescMessage() {
    const text = descInput.trim();
    if (!text || descBusy) return;

    setDescInput("");
    setDescMessages((prev) => [...prev, { id: uid(), role: "user", content: text }]);
    scrollChatToBottom();

    try {
      setDescBusy(true);
      setDescStatus("Refining…");

      const vc = await getVideoContext();

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
            ...descMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: text },
          ],
        },
      });

      const nextDraft = (data?.description ?? "").toString();
      setCurrentDraft(nextDraft);

      setDescMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: nextDraft || "(No description returned.)" },
      ]);
      scrollChatToBottom();
      setDescStatus("Done.");
    } catch (e: any) {
      setDescStatus(`Error: ${e?.message ?? String(e)}`);
      setDescMessages((prev) => [
        ...prev,
        { id: uid(), role: "assistant", content: `❌ ${e?.message ?? String(e)}` },
      ]);
      scrollChatToBottom();
    } finally {
      setDescBusy(false);
    }
  }

  async function generateChapters() {
    try {
      setChapBusy(true);
      setChapStatus("Requesting chapters…");
      setChapResult("");

      const vc = await getVideoContext();

      const data = await callBackend({
        task: "chapters",
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

      setChapResult(JSON.stringify(data?.chapters ?? data, null, 2));
      setChapStatus("Done.");
    } catch (e: any) {
      setChapStatus(`Error: ${e?.message ?? String(e)}`);
      setChapResult(`❌ ${e?.message ?? String(e)}`);
    } finally {
      setChapBusy(false);
    }
  }

  const SubTabButton = ({ id, label }: { id: SubTab; label: string }) => {
    const active = subTab === id;
    return (
      <button
        className={active ? "qfm-btn-primary" : "qfm-btn-secondary"}
        style={{
          padding: "8px 10px",
          borderRadius: 12,
        }}
        onClick={() => setSubTab(id)}
      >
        {label}
      </button>
    );
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10, height: "100%", minHeight: 0 }}>
      {/* Sub-tabs inside LLM */}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <SubTabButton id="description" label="Description" />
        <SubTabButton id="chapters" label="Chapters" />
      </div>

      {subTab === "description" ? (
        <>
          <div className="qfm-card">
            <div className="qfm-card-title">How to use</div>
            <div className="qfm-card-sub">
              1) Click <b>Rewrite Description</b> to generate a first draft. <br />
              2) Then send feedback (sections, tone, what to mention) and I’ll refine it.
            </div>
            <div className="qfm-inline-warn">
              Example: <i>“Make it shorter, include Links/Credits/Disclaimer, mention Champions League.”</i>
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="qfm-btn-secondary" onClick={generateFirstDescription} disabled={descBusy}>
              Rewrite Description
            </button>
            <button
              className="qfm-btn-secondary"
              onClick={() => navigator.clipboard.writeText(currentDraft)}
              disabled={!currentDraft}
              title="Copies the latest generated draft"
            >
              Copy draft
            </button>
          </div>

          <div className="qfm-muted">{descStatus}</div>

          {/* Chat thread (ONLY description-related messages) */}
          <div
            ref={chatListRef}
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
            {descMessages.length === 0 ? (
              <div className="qfm-muted">No messages yet. Click “Rewrite Description” to start.</div>
            ) : (
              descMessages.map((m) => {
                const isUser = m.role === "user";
                return (
                  <div key={m.id} style={{ display: "flex", justifyContent: isUser ? "flex-end" : "flex-start" }}>
                    <div
                      style={{
                        maxWidth: "92%",
                        whiteSpace: "pre-wrap",
                        borderRadius: 14,
                        padding: "10px 12px",
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "#fff",
                      }}
                    >
                      <div style={{ fontSize: 11, opacity: 0.7, marginBottom: 6, fontWeight: 800 }}>
                        {isUser ? "You" : "QFM"}
                      </div>
                      <div style={{ fontSize: 13, lineHeight: 1.35 }}>{m.content}</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Composer */}
          <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
            <textarea
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              rows={2}
              placeholder={
                currentDraft
                  ? `Give feedback (e.g. "Shorter + include Links/Credits/Disclaimer + mention Champions League")`
                  : `Click "Rewrite Description" first…`
              }
              style={{
                flex: 1,
                resize: "none",
                borderRadius: 12,
                border: "1px solid rgba(0,0,0,0.2)",
                padding: "10px 10px",
                fontSize: 13,
              }}
              disabled={descBusy || !currentDraft}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendDescMessage();
                }
              }}
            />
            <button className="qfm-btn-primary" onClick={sendDescMessage} disabled={descBusy || !descInput.trim() || !currentDraft}>
              Send
            </button>
          </div>
        </>
      ) : (
        <>
          {/* Chapters tab (separate tool + separate output) */}
          <div className="qfm-card">
            <div className="qfm-card-title">Chapters</div>
            <div className="qfm-card-sub">
              Click <b>Generate Chapters</b> to get timestamps and titles (kept within the video duration).
            </div>
          </div>

          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <button className="qfm-btn-secondary" onClick={generateChapters} disabled={chapBusy}>
              Generate Chapters
            </button>
            <button
              className="qfm-btn-secondary"
              onClick={() => navigator.clipboard.writeText(chapResult)}
              disabled={!chapResult}
              title="Copies the chapter JSON"
            >
              Copy
            </button>
          </div>

          <div className="qfm-muted">{chapStatus}</div>

          <textarea
            value={chapResult}
            readOnly
            rows={12}
            style={{
              width: "100%",
              flex: 1,
              minHeight: 0,
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.2)",
              padding: 10,
              fontSize: 12,
            }}
          />
        </>
      )}
    </div>
  );
}
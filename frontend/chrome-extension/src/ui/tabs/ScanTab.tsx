import { useEffect, useMemo, useState } from "react";
import { pushHistory } from "../storage";
import type { Rule, Issue } from "../types";

type Props = { backendUrl: string };

function uuid() {
    return crypto.randomUUID();
}

function formatDuration (seconds?: number) {
    if (typeof seconds !== "number" || !isFinite(seconds) || seconds < 0) return "-";
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
}

function getHashtags(text: string) {
  // basic hashtag detection
  return text.match(/(^|\s)#([A-Za-z0-9_]+)/g) ?? [];
}

function hasTimestamps(text: string) {
  // matches 0:00, 00:00, 1:23, 10:05, 1:02:03
  return /(^|\s)\d{1,2}:\d{2}(:\d{2})?(\s|$)/.test(text);
}

function firstTimestamp(text: string) {
  const m = text.match(/(^|\s)(\d{1,2}:\d{2}(:\d{2})?)(\s|$)/);
  return m?.[2] ?? null;
}

export function ScanTab({ backendUrl }: Props) {
    const [status, setStatus] = useState<string>("Ready to scan");
    const [running, setRunning] = useState(false);
    const [lastResult, setLastResult] = useState<any>(null);
    const [showRaw, setShowRaw] = useState(false);
    const [rules, setRules] = useState<Rule[] | null>(null);
    const [rulesError, setRulesError] = useState<string | null>(null);

    const coreChecklist = useMemo(
      () => [
        {
          key: "title_length",
          label: "Title length",
          help: "Keep the title short and readable.",
        },
        {
          key: "description_present",
          label: "Description present",
          help: "Add a description so viewers and YouTube understand the video.",
        },
        {
          key: "tags_present",
          label: "Tags present",
          help: "Add a few tags to help discovery (if tags are available).",
        },
      ],
      []
    );

    const extraChecklist = useMemo(
      () => [
        {
          key: "required_sections",
          label: "Description sections",
          help: "Include required sections like Links / Credits / Disclaimer.",
        },
        {
          key: "hashtag_limit",
          label: "Hashtag limit",
          help: "Avoid too many hashtags in the description.",
        },
        {
          key: "chapters_start",
          label: "Chapters start at 00:00",
          help: "If you use timestamps, the first chapter should start at 00:00.",
        },
      ],
      []
    );

    useEffect(() => {
      let cancelled = false;
  
      async function loadRules() {
        setRulesError(null);
  
        try {
          const res = await fetch(`${backendUrl}/rules`);
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const data = await res.json();
          if (cancelled) return;
  
          const list: Rule[] = Array.isArray(data?.rules) ? data.rules : [];
          setRules(list.length ? list : null);
        } catch (e: any) {
          if (cancelled) return;
          setRules(null);
          setRulesError("Couldn’t load rules from backend (showing defaults).");
        }
      }
  
      loadRules();
      return () => {
        cancelled = true;
      };
    }, [backendUrl]);

    function issueLabel(key: string) {
      return (
        coreChecklist.find((c) => c.key === key)?.label ??
        extraChecklist.find((c) => c.key === key)?.label ??
        key
      );
    }

    function ruleDescriptionFromBackend(ruleId: string) {
      return rules?.find((r) => r.id === ruleId)?.description ?? null;
    }

    async function runScan() {
      setRunning(true);
      setShowRaw(false);
      setStatus("Scanning…");

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

      const TITLE_MAX = 70;

      const title = (meta.title ?? "").trim();
      const description = (meta.description ?? "").trim();
      const tags = meta.tags;

      const issues: Issue[] = [
        {
          key: "title_length",
          ok: !!title && title.length <= TITLE_MAX,
          note: !title
            ? "Missing title"
            : title.length <= TITLE_MAX
            ? `OK (${title.length}/${TITLE_MAX})`
            : `Too long (${title.length}/${TITLE_MAX})`,
        },
        {
          key: "description_present",
          ok: !!description,
          note: description ? "OK" : "Missing description",
        },
        {
          key: "tags_present",
          ok: Array.isArray(tags) && tags.length > 0,
          note: Array.isArray(tags) ? `${tags.length} tag(s)` : "No tags found",
        },
      ];

      if (description) {
        const required = ["links", "credits", "disclaimer"];
        const missing = required.filter((r) => !description.toLowerCase().includes(r));
        issues.push({
          key: "required_sections",
          ok: missing.length === 0,
          note: missing.length === 0 ? "OK" : `Missing: ${missing.join(", ")}`,
        });

        const hashtags = getHashtags(description);
        issues.push({
          key: "hashtag_limit",
          ok: hashtags.length <= 3,
          note: `${hashtags.length} hashtag(s)`,
        });
      }

      if (hasTimestamps(description)) {
        const first = firstTimestamp(description);
        const ok = first === "0:00" || first === "00:00";
        issues.push({
          key: "chapters_start",
          ok,
          note: first ? `First timestamp: ${first}` : "Timestamps found",
        });
      }

      const record = {
        id: uuid(),
        createdAt: new Date().toISOString(),
        url: window.location.href,
        title: title || "(no title)",
        issues,
      };

      await pushHistory(record);

      setLastResult({ meta, issues });

      const passed = issues.filter((i) => i.ok).length;
      setStatus(`Done — ${passed}/${issues.length} checks passed (saved to history).`);
      setRunning(false);
    }

    const coreIssues: Issue[] = useMemo(() => {
      const issues: Issue[] = lastResult?.issues ?? [];
      const keys = new Set(coreChecklist.map((c) => c.key));
      return issues.filter((i) => keys.has(i.key));
    }, [lastResult, coreChecklist]);
  
    const extraIssues: Issue[] = useMemo(() => {
      const issues: Issue[] = lastResult?.issues ?? [];
      const keys = new Set(extraChecklist.map((c) => c.key));
      return issues.filter((i) => keys.has(i.key));
    }, [lastResult, extraChecklist]);

    const summary = useMemo(() => {
      if (!lastResult?.issues) return null;
      const issues: Issue[] = lastResult.issues;
      const passed = issues.filter((i) => i.ok).length;
      const failed = issues.length - passed;
      return { passed, failed, total: issues.length };
    }, [lastResult]);

    function renderIssueRow(issue: Issue) {
      return (
        <div key={issue.key} className="qfm-check-row">
          <div className="qfm-check-left">
            <div className="qfm-check-title">{issueLabel(issue.key)}</div>
            <div className="qfm-check-sub">
              {ruleDescriptionFromBackend(issue.key) ??
                coreChecklist.find((c) => c.key === issue.key)?.help ??
                extraChecklist.find((c) => c.key === issue.key)?.help ??
                ""}
            </div>
          </div>
  
          <div className="qfm-check-right">
            <span className={`qfm-badge ${issue.ok ? "pass" : "fail"}`}>
              {issue.ok ? "PASS" : "FAIL"}
            </span>
            {issue.note && <div className="qfm-check-note">{issue.note}</div>}
          </div>
        </div>
      );
    }

    return (
      <div className="qfm-stack">
        <button className="qfm-btn-primary" onClick={runScan} disabled={running}>
          {running ? "Scanning…" : "Run scan"}
        </button>
    
        <div className="qfm-muted">{status}</div>
    
        {/* Show the “what it checks” only BEFORE we have results */}
        {!lastResult && (
          <div className="qfm-card">
            <div className="qfm-card-title">What this scan checks</div>
            <div className="qfm-card-sub">
              Quick quality checks before you publish (no technical stuff).
            </div>
    
            {rulesError && <div className="qfm-inline-warn">{rulesError}</div>}
    
            <ul className="qfm-ul">
              {rules?.length ? (
                rules.slice(0, 6).map((r) => (
                  <li key={r.id}>
                    {r.description}
                    {r.severity ? <span className="qfm-pill">{r.severity}</span> : null}
                  </li>
                ))
              ) : (
                <>
                  <li>Title should be present and ≤ 70 characters</li>
                  <li>Description should not be empty</li>
                  <li>Tags should be present (when available)</li>
                </>
              )}
            </ul>
          </div>
        )}
    
        {lastResult && (
          <>
            <div className="qfm-card">
              <div className="qfm-card-title">Video summary</div>
    
              <div className="qfm-meta-grid">
                <div>
                  <div className="qfm-meta-k">Title</div>
                  <div className="qfm-meta-v">{lastResult.meta?.title || "—"}</div>
                </div>
                <div>
                  <div className="qfm-meta-k">Duration</div>
                  <div className="qfm-meta-v">
                    {formatDuration(lastResult.meta?.durationSeconds)}
                  </div>
                </div>
                <div>
                  <div className="qfm-meta-k">Video ID</div>
                  <div className="qfm-meta-v">{lastResult.meta?.videoId || "—"}</div>
                </div>
              </div>
    
              {summary && (
                <div className="qfm-summary">
                  <span className="qfm-summary-strong">
                    {summary.passed}/{summary.total} passed
                  </span>
                  {summary.failed > 0 ? (
                    <span className="qfm-summary-fail"> • {summary.failed} to fix</span>
                  ) : (
                    <span className="qfm-summary-pass"> • All good 🎉</span>
                  )}
                </div>
              )}
            </div>
    
            <div className="qfm-card">
              <div className="qfm-card-title">Core checks</div>
              <div className="qfm-divider" />
              <div className="qfm-checks">{coreIssues.map(renderIssueRow)}</div>
            </div>
    
            {/* Only show extra checks that FAIL (keeps UI compact) */}
            {extraIssues.some((i) => !i.ok) && (
              <div className="qfm-card">
                <div className="qfm-card-title">Additional fixes</div>
                <div className="qfm-divider" />
                <div className="qfm-checks">
                  {extraIssues.filter((i) => !i.ok).map(renderIssueRow)}
                </div>
              </div>
            )}
    
            <button className="qfm-btn-secondary" onClick={() => setShowRaw((v) => !v)}>
              {showRaw ? "Hide raw details" : "Show raw details"}
            </button>
    
            {showRaw && <pre className="qfm-raw">{JSON.stringify(lastResult, null, 2)}</pre>}
          </>
        )}
      </div>
    );
    

}
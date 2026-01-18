import { useEffect, useState } from "react";
import { getTemplates, setTemplates } from "../storage";
import type { Template } from "../types";

function uuid() {
  return crypto.randomUUID();
}

export function TemplatesTab() {
  const [templates, setLocal] = useState<Template[]>([]);
  const [name, setName] = useState("");
  const [body, setBody] = useState("");

  // Load saved templates on mount
  useEffect(() => {
    (async () => setLocal(await getTemplates()))();
  }, []);

  async function addTemplate() {
    const t: Template = { id: uuid(), name: name || "Untitled", body: body || "" };
    const next = [t, ...templates];
    setLocal(next);
    await setTemplates(next);
    setName("");
    setBody("");
  }

  async function removeTemplate(id: string) {
    const next = templates.filter((t) => t.id !== id);
    setLocal(next);
    await setTemplates(next);
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
        <textarea
          placeholder="Template body…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={5}
        />
        <button onClick={addTemplate}>Add</button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {templates.map((t) => (
          <div key={t.id} style={{ border: "1px solid rgba(0,0,0,0.12)", borderRadius: 10, padding: 10 }}>
            <div style={{ fontWeight: 700, fontSize: 13 }}>{t.name}</div>
            <div style={{ fontSize: 12, whiteSpace: "pre-wrap", marginTop: 6 }}>{t.body}</div>

            <div style={{ marginTop: 8, display: "flex", gap: 8 }}>
              <button onClick={() => navigator.clipboard.writeText(t.body)}>Copy</button>
              <button onClick={() => removeTemplate(t.id)}>Delete</button>
            </div>
          </div>
        ))}

        {templates.length === 0 && <div style={{ fontSize: 12, opacity: 0.7 }}>No templates yet.</div>}
      </div>
    </div>
  );
}

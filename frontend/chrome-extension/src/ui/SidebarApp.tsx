import { useEffect, useMemo, useState } from "react";
import { getSettings, setSettings } from "./storage";
import { ScanTab } from "./tabs/ScanTab";
import { LlmTab } from "./tabs/LlmTab";

type TabKey = "scan" | "templates" | "llm";

export default function SidebarApp() {
    const [tab, setTab] = useState<TabKey>("scan");
    const [backendUrl, setBackendUrl] = useState("http://localhost:8000");
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        (async () => {
            const settings = await getSettings();
            if (settings.backendUrl) setBackendUrl(settings.backendUrl);
            if (typeof settings.collapsed === "boolean") setCollapsed(settings.collapsed);
        })();
    }, []);

    const header = useMemo(() => {
        return (
            <div className="qfm-header">
                <div className="qfm-title">QforMedia</div>
                <div className="qfm-sub">YouTube Studio Helper</div>
            </div>
        );
    }, []);

    const toggleCollapsed = async () => {
        const nextAction = !collapsed;
        setCollapsed(nextAction);
        await setSettings({ collapsed: nextAction });
    };

    return (
        <div className={`qfm-shell ${collapsed? "collapsed" : ""}`}>
            {/* Always visible handle */}
            <button
                className={`qfm-collapse-btn ${collapsed ? "is-collapsed" : ""}`}
                onClick={toggleCollapsed}
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand" : "Collapse"}
            >
                <span className="qfm-collapse-arrow">{collapsed ? "›" : "‹"}</span>
                {collapsed && <span className="qfm-collapse-label">QFM Helper</span>}
            </button>

            <div className="qfm-body">
        {header}

            <div className="qfm-tabs">
                <button className={tab === "scan" ? "active" : ""} onClick={() => setTab("scan")}>
                    Scan
                </button>
                <button className={tab === "llm" ? "active" : ""} onClick={() => setTab("llm")}>
                    LLM
                </button>
            </div>

            <div className="qfm-content">
                {tab === "scan" && <ScanTab backendUrl={backendUrl} />}
                {tab === "llm" && <LlmTab backendUrl={backendUrl} />}
            </div>

            <div className="qfm-footer">
                <label className="qfm-label">
                    Backend URL
                    <input
                    value={backendUrl}
                    onChange={(e) => setBackendUrl(e.target.value)}
                    onBlur={() => setSettings({ backendUrl })}
                    placeholder="http://localhost:8000"
                    />
                </label>
            </div>
        </div>
    </div>
    );
}
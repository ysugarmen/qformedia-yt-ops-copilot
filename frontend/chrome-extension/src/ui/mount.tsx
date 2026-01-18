import { createRoot } from "react-dom/client";
import type { Root } from "react-dom/client";
import SidebarApp from "./SidebarApp";

let reactRoot: Root | null = null;

const CSS = `
.qfm-shell {
  /* sizing + positioning */
  width: 360px;
  height: calc(100vh - 32px);
  position: fixed;
  top: 16px;
  right: 16px;
  z-index: 2147483647;

  /* card look */
  background: #fff;
  border: 1px solid rgba(0,0,0,0.12);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.18);
  overflow: hidden;

  /* animation */
  transition: width 160ms ease;
  will-change: width;

  /* layout */
  display: flex;
  flex-direction: column;

}

.qfm-header { padding: 12px 14px; border-bottom: 1px solid rgba(0,0,0,0.08); }
.qfm-title { font-weight: 700; font-size: 16px; }
.qfm-sub { font-size: 12px; opacity: 0.7; margin-top: 2px; }

.qfm-tabs {
  display: flex;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.qfm-tabs button {
  font-size: 13px;
  padding: 8px 10px;
  border-radius: 10px;
  border: 1px solid rgba(0,0,0,0.12);
  background: #f6f6f6;
  cursor: pointer;
}
.qfm-tabs button.active {
  background: #111;
  color: #fff;
  border-color: #111;
}

.qfm-content { padding: 12px; overflow: auto; flex: 1; }

.qfm-footer {
  padding: 10px 12px;
  border-top: 1px solid rgba(0,0,0,0.08);
}
.qfm-label { display: flex; flex-direction: column; gap: 6px; font-size: 12px; }
.qfm-label input {
  border: 1px solid rgba(0,0,0,0.2);
  border-radius: 10px;
  padding: 8px 10px;
  font-size: 13px;
}

.qfm-shell.collapsed {
  width: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  overflow: visible;
}

/* In collapsed mode: hide all content but keep mounted (state preserved) */
.qfm-shell.collapsed .qfm-body {
  opacity: 0;
  pointer-events: none;
}


/* Toggle button (always clickable) */
.qfm-collapse-btn {
  position: absolute;
  top: 12px;
  right: -14px;

  height: 34px;
  border-radius: 999px;
  border: 1px solid rgba(0,0,0,0.18);
  background: #fff;

  cursor: pointer;
  padding: 0 10px;

  display: inline-flex;
  align-items: center;
  gap: 8px;

  z-index: 2147483647;
  pointer-events: auto;
  box-shadow: 0 6px 16px rgba(0,0,0,0.12);

  font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial;
}
.qfm-collapse-btn.is-collapsed {
  /* horizontal pill size */
  min-width: 92px;
  justify-content: flex-start;
}

/* Arrow circle */
.qfm-collapse-arrow {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(0,0,0,0.06);
  font-size: 16px;
  line-height: 1;
}

.qfm-collapse-label {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.2px;
}

.qfm-body {
  position: relative;
  z-index: 1;
}
`;


export function mount(container: HTMLElement) {
  if (reactRoot) return;

  // IMPORTANT: Shadow DOM isolates styles from YouTube
  const shadowRoot = container.attachShadow({ mode: "open" });

  // Inject CSS INTO the shadow root
  const styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  shadowRoot.appendChild(styleEl);

  // Create React mount point
  const app = document.createElement("div");
  shadowRoot.appendChild(app);

  reactRoot = createRoot(app);
  reactRoot.render(<SidebarApp />);
}

export function unmount() {
  reactRoot?.unmount();
  reactRoot = null;
}

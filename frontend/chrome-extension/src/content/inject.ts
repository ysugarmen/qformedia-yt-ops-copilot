
import { mount, unmount } from "../ui/mount";
import { watchSpaRoutes } from "./routeWatch";
import { extractStudioMetadata } from "./studioAdapter";

console.log("[QFM] content script loaded", location.href);

const ROOT_ID = "qfm-sidebar-root";

function isVideoDetailsPage(url: string) {
  const u = new URL(url);
  if (u.hostname !== "studio.youtube.com") return false;

  return /^\/video\/[^/]+\/(edit|details)/.test(u.pathname);
}

function ensureRoot() {
  let root = document.getElementById(ROOT_ID);
  if (root) return root;

  root = document.createElement("div");
  root.id = ROOT_ID;
  root.style.all = "initial";
  document.documentElement.appendChild(root);
  return root;
}

function removeRoot() {
  document.getElementById(ROOT_ID)?.remove();
}

async function mountSidebar() {
    const root = ensureRoot();
  
    root.innerHTML = `<div style="position:fixed;top:20px;right:20px;z-index:999999;background:yellow;padding:10px;border:1px solid #000">
      QFM TEST BOX
    </div>`;
  
    mount(root);
  }
  

function unmountSidebar() {
  unmount();
  removeRoot();
}

async function syncToRoute(url: string) {

  if (isVideoDetailsPage(url)) {
    await mountSidebar();
  } else {
    unmountSidebar();
  }
}


syncToRoute(location.href);


watchSpaRoutes((url) => syncToRoute(url));

window.addEventListener("message", (e: MessageEvent) => {
  if ((e.data as any)?.type === "QFM_GET_METADATA") {
    const payload = extractStudioMetadata();
    window.postMessage({ type: "QFM_METADATA", payload }, "*");
    console.log("[QFM] sent metadata", payload);
  }
});
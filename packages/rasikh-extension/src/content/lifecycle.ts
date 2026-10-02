// src/content/lifecycle.ts
// A content script does not persist across a full page navigation, and a single page app changes
// views without one. Both are handled here. startLifecycle() is called once per page by index.ts
// (behind the injected-once flag), so a grant that both registers and injects cannot double it.
import { onSettle } from "./perception/settle";

export function startLifecycle(): void {
  // announce readiness when injected, so the worker knows the page can be perceived
  chrome.runtime.sendMessage({
    type: "contentReady",
    source: "content",
    target: "worker",
    payload: { url: location.href },
    ts: Date.now()
  });

  // detect single page app view changes via history and the settle observer
  let lastUrl = location.href;
  const announceNav = () => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      chrome.runtime.sendMessage({
        type: "pageEvent",
        source: "content",
        target: "worker",
        payload: { kind: "navigation" },
        ts: Date.now()
      });
    }
  };
  const origPush = history.pushState;
  history.pushState = function (...args) {
    origPush.apply(this, args as any);
    announceNav();
  };
  addEventListener("popstate", announceNav);

  // a global settle watch keeps the worker informed of major view changes
  onSettle(function rearm() {
    announceNav();
    onSettle(rearm); // re arm after each settle, cheaply
  });
}

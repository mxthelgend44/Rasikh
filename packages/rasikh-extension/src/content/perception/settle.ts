// src/content/perception/settle.ts
const QUIET_MS = 250,
  MAX_WAIT_MS = 2000;

export function onSettle(cb: () => void) {
  const started = Date.now();
  let quiet: ReturnType<typeof setTimeout>;
  const fire = () => {
    obs.disconnect();
    cb();
  };
  const obs = new MutationObserver(() => {
    clearTimeout(quiet);
    if (Date.now() - started > MAX_WAIT_MS) return fire();
    quiet = setTimeout(fire, QUIET_MS);
  });
  obs.observe(document.documentElement, { subtree: true, childList: true, attributes: true });
  quiet = setTimeout(fire, QUIET_MS);
}

// when awaiting a student action, watch for a settled change and tell the worker
export function watchForStudentAction() {
  onSettle(() => {
    chrome.runtime.sendMessage({
      type: "pageEvent",
      payload: { kind: "mutationSettled" },
      source: "content",
      target: "worker",
      ts: Date.now()
    });
  });
}

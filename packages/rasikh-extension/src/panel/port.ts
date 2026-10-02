// src/panel/port.ts
const port = chrome.runtime.connect({ name: "panel" });

export function onPanelMessage(cb: (m: { type: string; payload: any }) => void) {
  port.onMessage.addListener(cb);
}
export function sendOverPort(type: string, payload: unknown) {
  port.postMessage({ type, payload });
}

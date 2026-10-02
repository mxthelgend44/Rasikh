// src/background/panelPort.ts
let panelPort: chrome.runtime.Port | null = null;

chrome.runtime.onConnect.addListener((port) => {
  if (port.name !== "panel") return;
  panelPort = port;
  port.onDisconnect.addListener(() => {
    panelPort = null;
  });
  port.onMessage.addListener((msg) => handlePanelMessage(msg));
});

export function pushToPanel(type: string, payload: unknown) {
  panelPort?.postMessage({ type, payload });
}

// The panel sends intents over runtime messaging (sendToWorker), so the inbound port channel
// is reserved for future low latency panel signals. Routed here so a future message is one
// typed addition rather than a new wiring path.
function handlePanelMessage(_msg: { type: string; payload: unknown }) {
  /* no inbound port messages today */
}

// src/shared/bus.ts
import type { Envelope } from "./types";

const newId = () => crypto.randomUUID();

const LOG = (import.meta as any).env?.VITE_LOG_BUS === "true";
function trace(env: Envelope) {
  if (LOG) console.debug(`[bus] ${env.source}->${env.target} ${env.type} #${env.id}`);
}

// worker -> content script, awaiting a typed reply, with a timeout
export function sendToTab<TReq, TRes>(
  tabId: number,
  type: string,
  payload: TReq,
  timeoutMs = 8000
): Promise<TRes> {
  const env: Envelope<TReq> = {
    id: newId(),
    source: "worker",
    target: "content",
    tabId,
    type,
    payload,
    ts: Date.now()
  };
  trace(env);
  return new Promise<TRes>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MSG_TIMEOUT")), timeoutMs);
    chrome.tabs.sendMessage(tabId, env, (res: Envelope<TRes>) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(res.payload);
    });
  });
}

// panel or content -> worker, awaiting a typed reply
export function sendToWorker<TReq, TRes>(
  type: string,
  payload: TReq,
  source: Envelope["source"],
  timeoutMs = 8000
): Promise<TRes> {
  const env: Envelope<TReq> = {
    id: newId(),
    source,
    target: "worker",
    type,
    payload,
    ts: Date.now()
  };
  trace(env);
  return new Promise<TRes>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("MSG_TIMEOUT")), timeoutMs);
    chrome.runtime.sendMessage(env, (res: Envelope<TRes>) => {
      clearTimeout(timer);
      if (chrome.runtime.lastError) return reject(new Error(chrome.runtime.lastError.message));
      resolve(res.payload);
    });
  });
}

// register a typed request handler; returning true keeps the channel open for async reply
export function onRequest<TReq, TRes>(
  type: string,
  handler: (p: TReq, sender: chrome.runtime.MessageSender) => Promise<TRes>
) {
  chrome.runtime.onMessage.addListener((env: Envelope<TReq>, sender, sendResponse) => {
    if (env.type !== type) return false;
    handler(env.payload, sender)
      .then((payload) =>
        sendResponse({
          id: newId(),
          replyTo: env.id,
          source: env.target,
          target: env.source,
          type: type + ":res",
          payload,
          ts: Date.now()
        })
      )
      .catch((err) =>
        sendResponse({
          id: newId(),
          replyTo: env.id,
          source: env.target,
          target: env.source,
          type: type + ":err",
          payload: { error: String(err) },
          ts: Date.now()
        })
      );
    return true; // critical: without this, async sendResponse is a no op
  });
}

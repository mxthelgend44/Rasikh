// src/background/state.ts
import type { AppState, TurnDigest } from "../shared/types";

export type { AppState } from "../shared/types";

const KEY = "appState";

// chrome.storage.session is in memory, cleared when the browser closes, readable by the worker
export async function loadState(): Promise<AppState> {
  const got = await chrome.storage.session.get(KEY);
  return (got[KEY] as AppState) ?? {};
}

export async function saveState(s: AppState): Promise<void> {
  // cap and compact history so storage does not balloon over a long guide
  if (s.lesson && s.lesson.history.length > 40) {
    s.lesson.history = compact(s.lesson.history);
  }
  await chrome.storage.session.set({ [KEY]: s });
}

function compact(h: TurnDigest[]): TurnDigest[] {
  const recent = h.slice(-20);
  const summary: TurnDigest = {
    role: "system",
    text: "Earlier in this guide the person progressed through several steps.",
    ts: recent[0]?.ts ?? Date.now()
  };
  return [summary, ...recent];
}

export async function clearAll(): Promise<void> {
  await chrome.storage.session.clear();
}

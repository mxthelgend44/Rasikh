// src/background/sites.ts
// Per-site grants. Host access is optional: nothing is granted at install except the local backend.
//
// There is deliberately NO static `content_scripts` entry in manifest.json: a static entry injects
// without a grant (verified in Chromium 148) and makes its matches count as required hosts, so the
// grant could not be revoked. Instead the content script is REGISTERED DYNAMICALLY for exactly one
// origin when the person grants it, and unregistered when they revoke it:
//   grantSite  = permissions.request (inside the click) -> registerContentScripts -> executeScript
//                into already-open tabs of that origin
//   revokeSite = unregisterContentScripts -> permissions.remove
// The worker also refuses to perceive a tab whose origin has not been granted (hasGrant).

// The built, self-contained content script (vite.content.config.ts writes it to dist/content.js).
export const CONTENT_SCRIPT_FILE = "content.js";
export const SCRIPT_ID_PREFIX = "rasikh-cs-";

// "https://portal.example.ae/path?q=1" -> "https://portal.example.ae/*"
export function originPattern(url: string): string | undefined {
  try {
    const u = new URL(url);
    if (u.protocol !== "https:" && u.protocol !== "http:") return undefined;
    return `${u.protocol}//${u.host}/*`;
  } catch {
    return undefined;
  }
}

// one registered script per origin pattern
export function scriptId(pattern: string): string {
  return SCRIPT_ID_PREFIX + pattern.replace(/[^a-z0-9]+/gi, "-").replace(/^-+|-+$/g, "");
}

export async function hasGrant(url: string | undefined): Promise<boolean> {
  const pattern = url ? originPattern(url) : undefined;
  if (!pattern) return false;
  try {
    return await chrome.permissions.contains({ origins: [pattern] });
  } catch {
    return false;
  }
}

export async function registerForOrigin(pattern: string): Promise<void> {
  const id = scriptId(pattern);
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [id] }); // idempotent: replace any stale copy
  } catch {
    /* not registered yet */
  }
  await chrome.scripting.registerContentScripts([
    {
      id,
      matches: [pattern],
      js: [CONTENT_SCRIPT_FILE],
      runAt: "document_idle",
      persistAcrossSessions: true,
      allFrames: false
    }
  ]);
}

export async function unregisterForOrigin(pattern: string): Promise<void> {
  try {
    await chrome.scripting.unregisterContentScripts({ ids: [scriptId(pattern)] });
  } catch {
    /* nothing registered for this origin */
  }
}

// inject into tabs that were already open when the grant happened (registered scripts only run on
// future navigations). Returns how many tabs were injected.
export async function injectIntoOpenTabs(pattern: string): Promise<number> {
  let n = 0;
  let tabs: chrome.tabs.Tab[] = [];
  try {
    tabs = await chrome.tabs.query({ url: pattern });
  } catch {
    return 0;
  }
  for (const tab of tabs) {
    if (tab.id == null) continue;
    try {
      await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: [CONTENT_SCRIPT_FILE] });
      n++;
    } catch {
      /* a tab that cannot be scripted (discarded, error page) is skipped */
    }
  }
  return n;
}

// Call from a user gesture (a click in the panel or settings page).
export async function grantSite(pattern: string): Promise<boolean> {
  const granted = await chrome.permissions.request({ origins: [pattern] });
  if (!granted) return false;
  await registerForOrigin(pattern);
  await injectIntoOpenTabs(pattern);
  return true;
}

export async function revokeSite(pattern: string): Promise<boolean> {
  await unregisterForOrigin(pattern);
  return chrome.permissions.remove({ origins: [pattern] });
}

// Keep registrations in step with the real grants (a grant can also be removed from
// chrome://extensions, or the browser profile can restore a stale registration).
export async function reconcileSites(): Promise<{ registered: string[]; unregistered: string[] }> {
  const backend = new Set<string>(chrome.runtime.getManifest?.()?.host_permissions ?? []);
  const all = await chrome.permissions.getAll();
  const granted = (all.origins ?? []).filter((o) => /^https?:\/\//.test(o) && !backend.has(o));
  const existing = (await chrome.scripting.getRegisteredContentScripts()).filter((s) => s.id.startsWith(SCRIPT_ID_PREFIX));
  const unregistered: string[] = [];
  const registered: string[] = [];
  for (const s of existing) {
    if (!(s.matches ?? []).every((m) => granted.includes(m))) {
      await chrome.scripting.unregisterContentScripts({ ids: [s.id] }).catch(() => undefined);
      unregistered.push(s.id);
    }
  }
  const have = new Set(existing.flatMap((s) => s.matches ?? []));
  for (const g of granted) {
    if (!have.has(g)) {
      await registerForOrigin(g);
      registered.push(g);
    }
  }
  return { registered, unregistered };
}

// kept for callers that only need the bare permission call
export const enableSite = grantSite;
export const disableSite = revokeSite;

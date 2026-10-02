// src/shared/validateSender.ts
export function senderIsTrusted(sender: chrome.runtime.MessageSender): boolean {
  // Exact id match, never a wildcard: the worst real exploit chain trusted a wildcard subdomain.
  // Content scripts of this extension carry our id; other extensions and web pages do not.
  if (sender.id !== chrome.runtime.id) return false;
  return true;
}

/**
 * True only for a content script running in a web page. An extension page opened in a tab (the
 * panel or the options page) also has `sender.tab`, but its url is our own chrome-extension:// origin
 * and a site grant means nothing for it, so the grant check must not apply to it.
 */
export function isContentScriptSender(sender: chrome.runtime.MessageSender): boolean {
  if (!sender.tab) return false;
  const own = chrome.runtime.getURL("");
  return !(sender.url ?? "").startsWith(own);
}

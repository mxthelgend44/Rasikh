// src/background/index.ts  (every handler wired)
import { onStartLesson, onNextStep, onPrevStep, onRepeatStep, onStopGuide, onPageEvent, onContentReady } from "./loop";
import { loadState } from "./state";
import { isContentScriptSender, senderIsTrusted } from "../shared/validateSender";
import { hasGrant, reconcileSites, unregisterForOrigin } from "./sites";
import "./panelPort";

// open the side panel when the toolbar icon is clicked
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

// keep the per-origin content-script registrations in step with the real grants
const reconcile = () => reconcileSites().catch(() => undefined);
chrome.runtime.onInstalled.addListener(reconcile);
chrome.runtime.onStartup.addListener(reconcile);
chrome.permissions.onRemoved.addListener((p) => {
  for (const o of p.origins ?? []) unregisterForOrigin(o);
});

chrome.runtime.onMessage.addListener((env, sender, sendResponse) => {
  // every inbound message asserts a trusted sender before anything else
  if (!senderIsTrusted(sender)) {
    sendResponse({ ok: false, error: "UNTRUSTED_SENDER" });
    return false;
  }
  (async () => {
    try {
      // messages from a content script are honoured only for a tab whose origin has been granted
      // (our own panel or options page, even when opened in a tab, is not a web page)
      if (isContentScriptSender(sender) && !(await hasGrant(sender.tab?.url))) {
        sendResponse({ ok: false, error: "NO_SITE_GRANT" });
        return;
      }
      switch (env.type) {
        case "startLesson":
          await onStartLesson(env.payload);
          break;
        case "nextStep":
          await onNextStep();
          break;
        case "prevStep":
          await onPrevStep();
          break;
        case "repeatStep":
          await onRepeatStep();
          break;
        case "stopGuide":
          await onStopGuide();
          break;
        case "requestState":
          sendResponse(await loadState());
          return;
        case "pageEvent":
          await onPageEvent(env.payload);
          break;
        case "contentReady":
          await onContentReady();
          break;
        default:
          break;
      }
      sendResponse({ ok: true });
    } catch (err) {
      sendResponse({ ok: false, error: String(err) });
    }
  })();
  return true; // keep the channel open for the async handler
});

// src/background/sidepanelControl.ts
// Opening and addressing the side panel. The toolbar click behavior is set in the worker entry;
// these helpers let the worker open the panel programmatically for a specific tab.
export async function openPanelForTab(tabId: number): Promise<void> {
  try {
    await chrome.sidePanel.open({ tabId });
  } catch {
    /* the panel opens on the toolbar action click by default */
  }
}

export async function enablePanelForTab(tabId: number): Promise<void> {
  await chrome.sidePanel.setOptions({
    tabId,
    path: "src/panel/index.html",
    enabled: true
  });
}

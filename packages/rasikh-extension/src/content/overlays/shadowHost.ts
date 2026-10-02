// src/content/overlays/shadowHost.ts
// A reusable full viewport shadow host. Overlays render inside the shadow root so the page cannot
// restyle them and they cannot restyle the page. The host is pointer-events:none so clicks pass
// through to the real control underneath, which is what guide me mode needs.
export function createShadowHost(zIndex = 2147483647): { host: HTMLDivElement; shadow: ShadowRoot } {
  const host = document.createElement("div");
  host.style.cssText = `position:fixed;inset:0;pointer-events:none;z-index:${zIndex};`;
  const shadow = host.attachShadow({ mode: "open" });
  document.documentElement.appendChild(host);
  return { host, shadow };
}

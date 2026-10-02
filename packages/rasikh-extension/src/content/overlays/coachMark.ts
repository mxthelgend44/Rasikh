// src/content/overlays/coachMark.ts
// Rendered into a shadow root so the page cannot restyle the overlay and vice versa. The host has
// pointer-events:none so every click goes to the real control: the person does the action.
// Rasikh palette: petrol ring, deep ink tip with ivory text. Motion only when the person has not
// asked for reduced motion.
let host: HTMLDivElement | null = null,
  shadow: ShadowRoot | null = null;
let teardown: (() => void) | null = null;

const CSS = `
  .ring { position:fixed; border:3px solid #0B6B78; border-radius:6px; box-sizing:border-box;
          outline:2px solid #F6E7CD; pointer-events:none; }
  .tip  { position:fixed; max-width:280px; background:#173C47; color:#F6E7CD;
          font:14px/1.45 system-ui, "Segoe UI", Tahoma, sans-serif;
          padding:10px 12px; border-radius:8px; border-inline-start:4px solid #E4AD42; pointer-events:none;
          text-align:start; box-shadow:0 2px 8px rgba(23,60,71,.35); }
  @media (prefers-reduced-motion: no-preference) {
    .ring, .tip { transition: left .12s ease, top .12s ease, width .12s ease, height .12s ease; }
  }`;

function ensureHost() {
  if (host && host.isConnected) return;
  host = document.createElement("div");
  host.setAttribute("data-rasikh-guide", "overlay");
  host.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:2147483647;";
  shadow = host.attachShadow({ mode: "open" });
  const style = document.createElement("style");
  style.textContent = CSS;
  shadow.appendChild(style);
  document.documentElement.appendChild(host);
}

export function showCoachMark(el: Element, message: string, spotlight = true): void {
  ensureHost();
  teardown?.();
  shadow!.querySelectorAll(".ring,.tip").forEach((n) => n.remove());
  const ring = document.createElement("div");
  ring.className = "ring";
  const tip = document.createElement("div");
  tip.className = "tip";
  tip.setAttribute("dir", "auto");
  tip.textContent = message; // textContent only: page or model text can never inject markup
  shadow!.append(ring, tip);
  const place = () => {
    const r = el.getBoundingClientRect();
    Object.assign(ring.style, {
      left: r.left - 4 + "px",
      top: r.top - 4 + "px",
      width: r.width + 8 + "px",
      height: r.height + 8 + "px",
      boxShadow: spotlight ? "0 0 0 9999px rgba(23,60,71,.30)" : "none"
    });
    const below = r.bottom + 10;
    const top = below + 90 > innerHeight ? Math.max(8, r.top - 10 - tip.offsetHeight) : below;
    Object.assign(tip.style, { left: Math.max(8, Math.min(r.left, innerWidth - 296)) + "px", top: top + "px" });
  };
  place();
  const onMove = () => requestAnimationFrame(place);
  addEventListener("scroll", onMove, true);
  addEventListener("resize", onMove);
  teardown = () => {
    removeEventListener("scroll", onMove, true);
    removeEventListener("resize", onMove);
    ring.remove();
    tip.remove();
  };
}

export function clearOverlays(): void {
  teardown?.();
  teardown = null;
  shadow?.querySelectorAll(".ring,.tip").forEach((n) => n.remove());
}

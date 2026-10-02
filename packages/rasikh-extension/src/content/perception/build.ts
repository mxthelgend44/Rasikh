// src/content/perception/build.ts
// Structure only: role, accessible name, label, placeholder, heading text, field type, required.
// Never a value. Personal-data fields are described by their label alone.
import { walk } from "./walk";
import { isVisible, isInteractive, inViewport } from "./predicates";
import { effectiveRole } from "./role";
import { accessibleName } from "./name";
import { isSensitive, isFormControl } from "./sanitize";
import { setRefMap } from "../refMap";
import { scrubText } from "../../shared/scrub";
import type { PageModel, UIElement } from "../../shared/types";

export function perceiveDom(): PageModel {
  const map = new Map<string, Element>();
  const elements: UIElement[] = [];
  let i = 0,
    budget = 4000; // cap nodes visited on huge pages

  for (const el of walk()) {
    if (budget-- <= 0) break;
    const role = effectiveRole(el);
    if (!isInteractive(el, role) || !isVisible(el)) continue;
    const r = el.getBoundingClientRect();
    const ref = "e" + i++;
    map.set(ref, el);
    const sensitive = isSensitive(el);
    const name = scrubText(accessibleName(el, { allowPlaceholder: !sensitive }));
    const out: UIElement = {
      ref,
      fingerprint: `${role}|${name}|${Math.round(r.left / 40)},${Math.round(r.top / 40)}`,
      role,
      name,
      state: readState(el),
      offscreen: inViewport(r) ? undefined : true,
      rect: { x: r.left, y: r.top, w: r.width, h: r.height }
    };
    if (sensitive) {
      out.sensitive = true;
    } else if (isFormControl(el)) {
      out.inputType = fieldType(el);
      if (isRequired(el)) out.required = true;
      const ph = el.getAttribute("placeholder");
      if (ph && ph.trim()) out.placeholder = scrubText(ph.trim().slice(0, 80));
    }
    elements.push(out);
  }
  setRefMap(map);

  return {
    url: location.origin + location.pathname, // no query string or fragment: they can carry tokens
    title: scrubText(document.title),
    site: "",
    view: "",
    partial: budget <= 0,
    viewport: {
      width: innerWidth,
      height: innerHeight,
      scrollX,
      scrollY,
      dpr: devicePixelRatio,
      zoom: 1
    },
    elements,
    salientText: salient(),
    capturedAt: Date.now()
  };
}

function fieldType(el: Element): string {
  if (el instanceof HTMLInputElement) return el.type || "text";
  if (el instanceof HTMLTextAreaElement) return "textarea";
  if (el instanceof HTMLSelectElement) return "select";
  return "text";
}
function isRequired(el: Element): boolean {
  return (el as HTMLInputElement).required === true || el.getAttribute("aria-required") === "true";
}
function readState(el: Element): UIElement["state"] {
  const s: NonNullable<UIElement["state"]> = {};
  if ((el as HTMLInputElement).disabled) s.disabled = true;
  if (el instanceof HTMLInputElement && (el.type === "checkbox" || el.type === "radio") && el.checked)
    s.checked = true; // a choice's checked state is structure, not typed text
  const exp = el.getAttribute("aria-expanded");
  if (exp) s.expanded = exp === "true";
  const sel = el.getAttribute("aria-selected");
  if (sel) s.selected = sel === "true";
  if (document.activeElement === el) s.focused = true;
  return Object.keys(s).length ? s : undefined;
}
function salient(): string {
  return scrubText(
    Array.from(document.querySelectorAll("h1,h2,h3,[role=heading]"))
      .map((h) => h.textContent?.trim() ?? "")
      .filter(Boolean)
      .slice(0, 8)
      .join(" | ")
      .slice(0, 400)
  );
}

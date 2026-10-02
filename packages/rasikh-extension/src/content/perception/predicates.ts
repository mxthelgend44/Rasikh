// src/content/perception/predicates.ts
export const INTERACTIVE_ROLES = new Set([
  "button",
  "link",
  "textbox",
  "searchbox",
  "combobox",
  "listbox",
  "option",
  "checkbox",
  "radio",
  "switch",
  "tab",
  "menuitem",
  "slider",
  "spinbutton",
  "treeitem",
  "toolbar"
]);
const NATIVELY_FOCUSABLE = new Set(["A", "BUTTON", "INPUT", "SELECT", "TEXTAREA", "SUMMARY"]);

export function isVisible(el: Element): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return false;
  const cs = getComputedStyle(el);
  if (cs.display === "none" || cs.visibility === "hidden" || cs.visibility === "collapse") return false;
  if (parseFloat(cs.opacity) === 0) return false;
  return true;
}

export function isInteractive(el: Element, role: string): boolean {
  if (INTERACTIVE_ROLES.has(role)) return true;
  if (NATIVELY_FOCUSABLE.has(el.tagName)) {
    if (el.tagName === "INPUT" && (el as HTMLInputElement).type === "hidden") return false;
    return true;
  }
  const ti = el.getAttribute("tabindex");
  if (ti !== null && parseInt(ti, 10) >= 0) return true;
  if (el.hasAttribute("onclick")) return true;
  return false;
}

export function inViewport(r: DOMRect): boolean {
  return r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth;
}

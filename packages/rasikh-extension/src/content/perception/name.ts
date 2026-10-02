// src/content/perception/name.ts
// A faithful subset of the ARIA accessible name algorithm, in priority order. A form control's
// name never falls back to its text content or value, because for an editable control that text IS
// what the person typed.
import { isFormControl } from "./sanitize";

export function accessibleName(el: Element, opts: { allowPlaceholder?: boolean } = {}): string {
  const allowPlaceholder = opts.allowPlaceholder ?? true;
  // 1. aria-labelledby, resolving referenced ids
  const lb = el.getAttribute("aria-labelledby");
  if (lb) {
    const text = lb
      .split(/\s+/)
      .map((id) => {
        const ref = el.ownerDocument.getElementById(id);
        // The select-only combobox pattern lists the control itself in aria-labelledby, so its
        // name would carry the value the person chose. Never read the control or its contents.
        if (!ref || ref === el || el.contains(ref)) return "";
        return ref.textContent?.trim() ?? "";
      })
      .filter(Boolean)
      .join(" ");
    if (text) return collapse(text);
  }
  // 2. aria-label
  const al = el.getAttribute("aria-label");
  if (al && al.trim()) return collapse(al);
  // 3. associated label
  const id = (el as HTMLElement).id;
  if (id) {
    const lab = el.ownerDocument.querySelector(`label[for="${cssEscape(id)}"]`);
    if (lab?.textContent?.trim()) return collapse(lab.textContent);
  }
  const wrap = el.closest("label");
  if (wrap) {
    const own = isFormControl(el) ? labelTextWithoutControls(wrap) : (wrap.textContent ?? "").trim();
    if (own) return collapse(own);
  }
  // 4. placeholder or title
  if (allowPlaceholder) {
    const ph = el.getAttribute("placeholder");
    if (ph && ph.trim()) return collapse(ph);
  }
  const title = el.getAttribute("title");
  if (title && title.trim()) return collapse(title);
  // button-like inputs show their value attribute as the caption (a label, not personal data)
  if (el instanceof HTMLInputElement && ["submit", "button", "reset"].includes(el.type) && el.value.trim())
    return collapse(el.value).slice(0, 120);
  if (isFormControl(el)) return ""; // never fall back to text content or value
  // 5. visible text
  const txt = el.textContent?.trim();
  if (txt) return collapse(txt).slice(0, 120);
  // 6. nested image alt for icon buttons
  const img = el.querySelector("img[alt]") as HTMLImageElement | null;
  if (img?.alt?.trim()) return collapse(img.alt);
  return "";
}
function labelTextWithoutControls(label: Element): string {
  const clone = label.cloneNode(true) as Element;
  clone.querySelectorAll("input,textarea,select,[contenteditable]").forEach((n) => n.remove());
  return clone.textContent?.trim() ?? "";
}
const collapse = (s: string) => s.replace(/\s+/g, " ").trim();
const cssEscape = (s: string) =>
  typeof window.CSS?.escape === "function" ? CSS.escape(s) : s.replace(/"/g, '\\"');

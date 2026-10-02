// src/content/perception/role.ts
const TAG_ROLE: Record<string, string> = {
  A: "link",
  BUTTON: "button",
  SELECT: "combobox",
  TEXTAREA: "textbox",
  SUMMARY: "button"
};
export function effectiveRole(el: Element): string {
  const explicit = el.getAttribute("role");
  if (explicit) return explicit.trim().split(/\s+/)[0];
  if (el.tagName === "INPUT") {
    const t = (el as HTMLInputElement).type;
    if (t === "checkbox") return "checkbox";
    if (t === "radio") return "radio";
    if (t === "range") return "slider";
    if (t === "search") return "searchbox";
    if (["text", "email", "url", "tel", "password", "number"].includes(t)) return "textbox";
    if (["submit", "button", "reset", "image"].includes(t)) return "button";
  }
  return TAG_ROLE[el.tagName] ?? "generic";
}

// src/content/perception/sanitize.ts
// Which fields hold personal data. Such a field is described by its label only: no value (no field
// is ever read), and no type, placeholder or required flag either.
const HINT =
  /pass(word|code)?|pwd|otp|one[-_ ]?time|verification|2fa|mfa|pin\b|card|cvv|cvc|expir|iban|swift|account[-_ ]?(no|num)|ssn|secret|token|api[-_ ]?key|passport|emirates|\beid\b|784|national[-_ ]?id|identity|id[-_ ]?(no|num)|visa[-_ ]?(no|num)|birth|dob|رقم الهوية|جواز|كلمة المرور/i;

export function isSensitive(el: Element): boolean {
  if (el instanceof HTMLInputElement) {
    if (el.type === "password") return true;
    if (["hidden", "submit", "button", "reset", "image", "checkbox", "radio"].includes(el.type)) return false;
    if (["tel", "email"].includes(el.type)) return true;
  } else if (!(el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)) {
    if (!isEditableHost(el)) return false;
  }
  const ac = (el.getAttribute("autocomplete") ?? "").toLowerCase();
  if (/cc-|one-time-code|current-password|new-password|bday|tel|email|street-address|postal/.test(ac)) return true;
  const labelText = el.id
    ? (el.ownerDocument.querySelector(`label[for="${el.id.replace(/"/g, '\\"')}"]`)?.textContent ?? "")
    : "";
  const hint = [
    (el as HTMLInputElement).name,
    el.id,
    el.getAttribute("aria-label"),
    el.getAttribute("placeholder"),
    labelText,
    el.closest("label")?.textContent ?? ""
  ]
    .filter(Boolean)
    .join(" ");
  return HINT.test(hint);
}

export function isEditableHost(el: Element): boolean {
  const role = el.getAttribute("role");
  return (
    (el as HTMLElement).isContentEditable === true ||
    el.getAttribute("contenteditable") === "" ||
    el.getAttribute("contenteditable") === "true" ||
    role === "textbox" ||
    role === "searchbox" ||
    role === "combobox" ||
    role === "spinbutton"
  );
}

export function isFormControl(el: Element): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    isEditableHost(el)
  );
}

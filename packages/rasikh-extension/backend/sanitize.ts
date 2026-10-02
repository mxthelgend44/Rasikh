// backend/sanitize.ts  (the server side second line of defense)
// Perception already has no values. If a tampered or buggy client sends one anyway, it is dropped
// here, and every string is scrubbed for personal-data patterns before it can reach a prompt or a log.
import type { PageModel } from "../src/shared/types";
import { scrubText } from "../src/shared/scrub";

export function sanitizeServerSide(model: PageModel): PageModel {
  return {
    ...model,
    url: scrubText(String(model.url ?? "").split(/[?#]/)[0]),
    title: scrubText(String(model.title ?? "")).slice(0, 200),
    elements: (model.elements ?? []).map((e) => {
      const { value: _drop, backendNodeId: _b, ...rest } = e as any;
      const out: any = { ...rest, name: scrubText(String(e.name ?? "")).slice(0, 160) };
      if (e.sensitive) {
        delete out.placeholder;
        delete out.inputType;
        delete out.required;
      } else if (typeof out.placeholder === "string") out.placeholder = scrubText(out.placeholder).slice(0, 80);
      return out;
    }),
    salientText: scrubText(String(model.salientText ?? "")).slice(0, 400)
  };
}

export function serializePageModel(model: PageModel, last?: unknown): string {
  // a compact, fenced, explicitly untrusted representation for the prompt
  const lines = model.elements.map(
    (e) =>
      `${e.ref} ${e.role} "${e.name}"${e.sensitive ? " (personal data, label only)" : ""}${
        e.inputType ? ` [${e.inputType}${e.required ? ", required" : ""}]` : ""
      }${e.state?.disabled ? " (disabled)" : ""}${e.offscreen ? " (offscreen)" : ""}`
  );
  return [
    `<page url="${model.url}" view="${model.view}" untrusted="true">`,
    `Headings: ${model.salientText}`,
    `Elements:`,
    ...lines,
    last ? `Last action result: ${JSON.stringify({ ok: (last as any).ok, failureCode: (last as any).failureCode })}` : ``,
    `</page>`
  ]
    .filter(Boolean)
    .join("\n");
}

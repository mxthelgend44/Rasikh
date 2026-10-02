// src/shared/conditions.ts
// Structure-only step conditions. A skillpack step's `verify` string is compiled here. It can look at
// the URL, headings and the presence of controls, never at field values (perception has none).
// Grammar (an unknown condition fails closed, so the person simply presses "I did this"):
//   url:<substring>        the page URL contains the text (case-insensitive)
//   heading:<regex>        a page heading matches
//   text:<regex>           a page heading or a control name matches
//   present:<controlKey>   the pack control resolves to a control on the page
//   absent:<controlKey>    the pack control does not resolve
//   a && b                 both hold
import type { PageModel, SkillPack } from "./types";
import { findControlByKey } from "./findControl";

export function checkCondition(cond: string | undefined, model: PageModel, pack?: SkillPack): boolean {
  if (!cond) return false;
  const parts = cond.split("&&").map((s) => s.trim());
  return parts.every((p) => checkOne(p, model, pack));
}

function checkOne(c: string, model: PageModel, pack?: SkillPack): boolean {
  const i = c.indexOf(":");
  if (i < 0) return false;
  const kind = c.slice(0, i).trim();
  const arg = c.slice(i + 1).trim();
  try {
    switch (kind) {
      case "url":
        return model.url.toLowerCase().includes(arg.toLowerCase());
      case "heading":
        return new RegExp(arg, "i").test(model.salientText);
      case "text":
        return new RegExp(arg, "i").test(model.salientText) || model.elements.some((e) => new RegExp(arg, "i").test(e.name));
      case "present":
        return !!pack && !!findControlByKey(pack, arg, model);
      case "absent":
        return !!pack && !findControlByKey(pack, arg, model);
      default:
        return false;
    }
  } catch {
    return false;
  }
}

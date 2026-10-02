// backend/resolve.ts  (also mirrored client side for the page model's site and view fields)
import type { PageModel, SkillPack } from "../src/shared/types";

export function resolveSite(url: string, packs: SkillPack[]): SkillPack | undefined {
  return packs.find((p) => p.urlPatterns.some((pat) => matchGlob(pat, url)));
}
export function resolveView(model: PageModel, pack: SkillPack): string {
  for (const [view, def] of Object.entries(pack.views)) {
    const present = def.signature.every((ctrl) => controlPresent(ctrl, model));
    if (present) return view;
  }
  return "";
}
function controlPresent(ctrl: { selectors: { kind: string; value: string }[] }, model: PageModel): boolean {
  return ctrl.selectors.some((s) =>
    s.kind === "roleName"
      ? model.elements.some((e) => `${e.role}|${e.name}`.toLowerCase().includes(s.value.toLowerCase()))
      : model.elements.some((e) => e.name.toLowerCase().includes(s.value.toLowerCase()))
  );
}
function matchGlob(pattern: string, url: string): boolean {
  const re = new RegExp(
    "^" + pattern.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$"
  );
  return re.test(url);
}

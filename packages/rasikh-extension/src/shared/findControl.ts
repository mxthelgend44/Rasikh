// src/shared/findControl.ts
// Resolve a skillpack control (a list of selector layers) to an element in the structure-only model.
import type { ControlRef, PageModel, SkillPack, UIElement } from "./types";

export function findControl(ctrl: ControlRef, model: PageModel): UIElement | undefined {
  for (const layer of ctrl.selectors) {
    let hit: UIElement | undefined;
    try {
      switch (layer.kind) {
        case "testid":
          hit = model.elements.find((e) => e.fingerprint.includes(layer.value));
          break;
        case "roleName": {
          const [role, ...rest] = layer.value.split("|");
          const name = rest.join("|");
          hit = model.elements.find((e) => e.role === role && new RegExp(name, "i").test(e.name));
          break;
        }
        case "textInRegion":
          hit = model.elements.find((e) => new RegExp(layer.value, "i").test(e.name));
          break;
        case "structural":
          hit = model.elements.find((e) => e.ref === layer.value);
          break;
      }
    } catch {
      hit = undefined; // a bad regex in a pack must never crash the guide
    }
    if (hit) return hit;
  }
  return undefined;
}

export function findControlByKey(pack: SkillPack, key: string, model: PageModel): UIElement | undefined {
  for (const view of Object.values(pack.views)) {
    const ctrl = view.controls.find((c) => c.key === key);
    if (ctrl) {
      const hit = findControl(ctrl, model);
      if (hit) return hit;
    }
  }
  return undefined;
}

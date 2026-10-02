// src/content/perception/schema.ts
// A light runtime guard for the page model, used at boundaries where an untyped value arrives
// (e.g. a message payload). The shared types remain the compile time source of truth.
import type { PageModel, UIElement } from "../../shared/types";

export function isUIElement(x: unknown): x is UIElement {
  if (!x || typeof x !== "object") return false;
  const e = x as Record<string, unknown>;
  return (
    typeof e.ref === "string" &&
    typeof e.role === "string" &&
    typeof e.name === "string" &&
    typeof e.rect === "object" &&
    e.rect !== null
  );
}

export function isPageModel(x: unknown): x is PageModel {
  if (!x || typeof x !== "object") return false;
  const m = x as Record<string, unknown>;
  return (
    typeof m.url === "string" &&
    typeof m.title === "string" &&
    Array.isArray(m.elements) &&
    (m.elements as unknown[]).every(isUIElement)
  );
}

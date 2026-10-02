// src/content/refMap.ts
// The per turn map from a short reference (e12) to the live DOM node it names.
let refMap = new Map<string, Element>();
export function setRefMap(m: Map<string, Element>) {
  refMap = m;
}
export function resolveRef(ref: string): Element | undefined {
  return refMap.get(ref);
}

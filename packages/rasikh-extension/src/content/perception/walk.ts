// src/content/perception/walk.ts
// A shadow piercing, frame descending walker: it enters open shadow roots and reachable frames.
export function* walk(root: ParentNode = document): Generator<Element> {
  const stack: ParentNode[] = [root];
  while (stack.length) {
    const node = stack.pop()!;
    const kids = Array.from((node as ParentNode).children ?? []);
    for (const el of kids) {
      yield el;
      const sr = (el as HTMLElement).shadowRoot; // open shadow root
      if (sr) stack.push(sr);
      if (el.tagName === "IFRAME") {
        try {
          const doc = (el as HTMLIFrameElement).contentDocument; // null/throws for cross origin
          if (doc) stack.push(doc);
        } catch {
          /* opaque cross origin frame, skip */
        }
      }
      if (el.children.length) stack.push(el);
    }
  }
}

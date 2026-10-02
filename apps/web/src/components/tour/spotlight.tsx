'use client';

import { useEffect, useRef } from 'react';

/** How long to keep looking for a target that has not rendered yet (pages hydrate and load data). */
export const TARGET_RETRY_MS = 10000;
const PAD = 6;
const EDGE = 4;
const SLIDE_MS = 300;

export interface SpotlightArea {
  top: number;
  bottom: number;
}

export interface SpotlightProps {
  /** CSS selector of the element to highlight. Missing or unmatched: nothing is drawn. */
  selector: string | undefined;
  /** Changes with the step, so the same selector on a new step is revealed again. */
  stepKey: string;
  reducedMotion: boolean;
  /** The part of the viewport not covered by the guide, used to centre the target. */
  getArea: (target: Element) => SpotlightArea;
}

/** The first match that is actually on screen, so a hidden desktop table row never shadows its phone card. */
function safeQuery(selector: string): Element | null {
  try {
    const all = document.querySelectorAll(selector);
    for (const node of all) {
      const rect = node.getBoundingClientRect();
      if (rect.width > 0 || rect.height > 0) return node;
    }
    return all[0] ?? null;
  } catch {
    return null;
  }
}

function scrollParentOf(node: Element): Element | null {
  let current = node.parentElement;
  while (current && current !== document.body && current !== document.documentElement) {
    const { overflowY } = getComputedStyle(current);
    if (
      /(auto|scroll|overlay)/.test(overflowY) &&
      current.scrollHeight > current.clientHeight + 1
    ) {
      return current;
    }
    current = current.parentElement;
  }
  return null;
}

/** Brings the target into the free part of the screen. Smooth only when motion is allowed. */
function reveal(node: Element, area: SpotlightArea, reducedMotion: boolean) {
  const rect = node.getBoundingClientRect();
  if (rect.width === 0 && rect.height === 0) return;
  const margin = 16;
  if (rect.top >= area.top + margin && rect.bottom <= area.bottom - margin) return;
  const free = area.bottom - area.top;
  const delta =
    rect.height > free - margin * 2
      ? rect.top - (area.top + margin)
      : rect.top + rect.height / 2 - (area.top + free / 2);
  const behavior: ScrollBehavior = reducedMotion ? 'auto' : 'smooth';
  const parent = scrollParentOf(node);
  if (parent) parent.scrollBy({ top: delta, behavior });
  else window.scrollBy({ top: delta, behavior });
}

/**
 * A highlight ring that follows its target, with a soft ink dimmer made from one very large
 * box-shadow. It never takes pointer events, so the page underneath stays fully usable.
 */
export function Spotlight({ selector, stepKey, reducedMotion, getArea }: SpotlightProps) {
  const ringRef = useRef<HTMLDivElement>(null);
  const areaRef = useRef(getArea);
  areaRef.current = getArea;

  useEffect(() => {
    const ring = ringRef.current;
    if (!ring) return;
    const ringNode: HTMLDivElement = ring;

    let target: Element | null = null;
    let frame = 0;
    let observer: MutationObserver | null = null;
    let poll = 0;
    let giveUp = 0;
    let settle = 0;
    let cancelled = false;
    let visible = ringNode.style.opacity === '1';
    let lastKey = '';

    function hide() {
      if (visible) {
        ringNode.style.transition = reducedMotion ? 'none' : 'opacity 180ms ease-out';
        ringNode.style.opacity = '0';
        visible = false;
      }
      lastKey = '';
    }

    function stopSearching() {
      observer?.disconnect();
      observer = null;
      window.clearInterval(poll);
      window.clearTimeout(giveUp);
    }

    function paint() {
      if (cancelled) return;
      if (!target || !target.isConnected) {
        target = null;
        hide();
        search();
        return;
      }
      const rect = target.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const offscreen = rect.bottom < 0 || rect.top > vh || rect.right < 0 || rect.left > vw;
      if ((rect.width === 0 && rect.height === 0) || offscreen) {
        hide();
      } else {
        const x = Math.max(rect.left - PAD, EDGE);
        const y = Math.max(rect.top - PAD, EDGE);
        const w = Math.max(Math.min(rect.right + PAD, vw - EDGE) - x, 0);
        const h = Math.max(Math.min(rect.bottom + PAD, vh - EDGE) - y, 0);
        const key = `${Math.round(x)}|${Math.round(y)}|${Math.round(w)}|${Math.round(h)}`;
        if (key !== lastKey || !visible) {
          lastKey = key;
          ringNode.style.transform = `translate3d(${x}px, ${y}px, 0)`;
          ringNode.style.width = `${w}px`;
          ringNode.style.height = `${h}px`;
          if (!visible) {
            ringNode.style.opacity = '1';
            visible = true;
          }
        }
      }
      frame = requestAnimationFrame(paint);
    }

    function attach(node: Element) {
      stopSearching();
      target = node;
      reveal(node, areaRef.current(node), reducedMotion);
      if (reducedMotion) {
        ringNode.style.transition = 'none';
      } else {
        // Slide between targets, fade in from nothing, then track exactly while scrolling.
        ringNode.style.transition = visible
          ? `transform ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), width ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), height ${SLIDE_MS}ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 180ms ease-out`
          : 'opacity 220ms ease-out';
        settle = window.setTimeout(() => {
          if (!cancelled) ringNode.style.transition = 'opacity 180ms ease-out';
        }, SLIDE_MS + 40);
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(paint);
    }

    function search() {
      stopSearching();
      if (!selector) return;
      const found = safeQuery(selector);
      if (found) {
        attach(found);
        return;
      }
      const check = () => {
        const next = safeQuery(selector);
        if (next) attach(next);
      };
      observer = new MutationObserver(check);
      observer.observe(document.body, { childList: true, subtree: true });
      poll = window.setInterval(check, 250);
      giveUp = window.setTimeout(stopSearching, TARGET_RETRY_MS);
    }

    if (!selector) {
      hide();
    } else {
      // A step on another page: do not leave the old highlight hanging while the new page loads.
      if (!safeQuery(selector)) hide();
      search();
    }

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      stopSearching();
    };
  }, [selector, stepKey, reducedMotion]);

  return <div ref={ringRef} aria-hidden className="rasikh-tour-ring" />;
}

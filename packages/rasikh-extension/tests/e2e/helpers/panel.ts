// Driving the side panel the way a person would: read the step card, press "I did this, next step".
// The panel is a normal extension page opened in a tab (a script cannot open the real side panel).
import type { Page } from "@playwright/test";
import { coachMark, sleep, waitFor, type Ext, type Rect } from "./ext";

export interface StepView {
  eyebrow: string;
  title: string;
  message: string;
  index: number;
  total: number;
  complete: boolean;
  notFound: boolean;
}

export class Panel {
  constructor(public page: Page, private ext: Ext) {}

  static async open(ext: Ext): Promise<Panel> {
    return new Panel(await ext.openPanel(), ext);
  }

  /** Read the step card (null when no guide is running). */
  async step(): Promise<StepView | null> {
    return this.page.evaluate(() => {
      const card = document.querySelector("section.step");
      if (!card) return null;
      const eyebrow = card.querySelector(".eyebrow")?.textContent ?? "";
      const m = /(\d+)\s*\/\s*(\d+)/.exec(eyebrow);
      return {
        eyebrow,
        title: card.querySelector("h2")?.textContent ?? "",
        message: card.querySelector(".message")?.textContent ?? "",
        index: m ? +m[1] - 1 : -1,
        total: m ? +m[2] : -1,
        complete: !!card.querySelector(".note.ok"),
        notFound: [...card.querySelectorAll(".note")].some((n) => !n.classList.contains("ok") && /cannot see|لا أستطيع/.test(n.textContent ?? ""))
      };
    });
  }

  async packs(): Promise<{ name: string; tasks: string[] }[]> {
    return this.page.evaluate(() =>
      [...document.querySelectorAll("ul.packs > li")].map((li) => ({
        name: li.querySelector(".pack-name")?.textContent ?? "",
        tasks: [...li.querySelectorAll(".row.between > span")].map((s) => s.textContent ?? "")
      }))
    );
  }

  async text(): Promise<string> {
    return this.page.evaluate(() => document.body.innerText);
  }

  async start(packNameRe: RegExp): Promise<void> {
    const li = this.page.locator("ul.packs > li").filter({ has: this.page.locator(".pack-name", { hasText: packNameRe }) });
    await li.first().locator("button.btn").first().click();
  }

  async next() {
    await this.page.locator("section.step button.btn:not(.btn-quiet):not(.btn-link)").first().click();
  }
  async stop() {
    await this.page.locator("section.step button.btn-link").click();
  }
  async setLang(l: "en" | "ar") {
    await this.page.selectOption("header select", l);
  }
  async grantButton() {
    return this.page.locator("section[aria-labelledby=access-h] button.btn:not(.btn-quiet)");
  }

  /** Wait until the guide step index equals n (the guide may auto-advance on its own structural check). */
  async waitForIndex(n: number, ms = 8000): Promise<StepView | null> {
    return waitFor(async () => {
      const s = await this.step();
      return s && s.index === n ? s : null;
    }, ms);
  }
}

/** What the coach mark is wrapping on the page right now: the control under the middle of the ring (the overlay ignores the pointer). */
export async function highlighted(portal: Page): Promise<{ id: string; tag: string; ring: Rect | null; tip: string | null } | null> {
  const cm = await coachMark(portal);
  if (!cm.ring) return null;
  const hit = await portal.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y) as HTMLElement | null;
    if (!el) return null;
    const c = el.closest("input,select,textarea,button,a,[role=combobox],[role=option],label,summary,li") ?? el;
    return { id: (c as HTMLElement).id || (c as HTMLInputElement).name || "", tag: c.tagName };
  }, { x: cm.ring.x + cm.ring.w / 2, y: cm.ring.y + cm.ring.h / 2 });
  return hit ? { ...hit, ring: cm.ring, tip: cm.tip } : null;
}

export { sleep };

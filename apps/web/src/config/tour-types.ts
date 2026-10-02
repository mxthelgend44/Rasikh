/** The shape of one stop in the presenter's guided tour. Content lives in config/tour.ts. */
export type TourSurface =
  | "hub"
  | "newcomer"
  | "employer"
  | "landlord"
  | "bank"
  | "design";

/** `demo` is the three-minute story; `features` adds the rest of what the product does. */
export type TourTrack = "demo" | "features";

export interface TourStep {
  id: string;
  tracks: TourTrack[];
  surface: TourSurface;
  /** The route this stop happens on. May carry a query, e.g. /newcomer?as=anders. */
  href: string;
  /** CSS selector of the element to spotlight. Optional: no match means a centred card. */
  target?: string;
  title: string;
  /** One sentence: what this screen proves. */
  summary: string;
  /** What to say, in order. 2 to 4 short lines. */
  say: string[];
  /** What to click or point at, in order. */
  show: string[];
  /** Feature tags shown as chips, e.g. "Live sync". */
  features: string[];
  seconds: number;
  /** A limitation to state plainly at this stop, if there is one. */
  honesty?: string;
}

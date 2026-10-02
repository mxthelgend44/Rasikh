// src/content/perception/pipeline.ts
import { perceiveDom } from "./build";
import { onSettle } from "./settle";
import type { PageModel } from "../../shared/types";

export async function perceive(): Promise<PageModel> {
  await settleOnce(); // wait for the DOM to stop changing
  return perceiveDom(); // walk, classify, ref. Structure only: no screenshots, no values.
}

function settleOnce(): Promise<void> {
  return new Promise((res) => onSettle(res));
}

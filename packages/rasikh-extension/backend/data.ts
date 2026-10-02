// backend/data.ts
// Skillpack registry. Packs are authored in skillpacks/*.ts (X2) and loaded at startup by file, so
// adding a pack needs no code change here. A small placeholder pack is always present so the guide
// can be exercised before real packs exist. Everything is in memory; there is no account or datastore.
import { readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import type { Objective, SkillPack } from "../src/shared/types";
import { placeholderPack } from "./placeholderPack";

let PACKS: Record<string, SkillPack> = { [placeholderPack.id]: placeholderPack };

export function isSkillPack(x: any): x is SkillPack {
  return !!x && typeof x === "object" && typeof x.id === "string" && Array.isArray(x.tasks) && typeof x.views === "object";
}

export function registerPacks(packs: SkillPack[], replace = false) {
  if (replace) PACKS = {};
  for (const p of packs) PACKS[p.id] = p;
}

export async function loadPacksFromDir(dir?: string): Promise<SkillPack[]> {
  const base = dir ?? resolve(dirname(fileURLToPath(import.meta.url)), "..", "skillpacks");
  const found: SkillPack[] = [];
  let files: string[] = [];
  try {
    files = readdirSync(base).filter((f) => /\.(ts|js|mjs)$/.test(f) && !/\.(verify|test|spec)\./.test(f) && !f.endsWith(".d.ts"));
  } catch {
    return found;
  }
  for (const f of files) {
    try {
      const mod = await import(/* @vite-ignore */ pathToFileURL(join(base, f)).href);
      for (const v of Object.values(mod)) if (isSkillPack(v)) found.push(v);
    } catch (e) {
      console.warn(`skillpack ${f} not loaded: ${(e as Error).message}`);
    }
  }
  return found;
}

export async function initPacks(dir?: string): Promise<string[]> {
  const loaded = await loadPacksFromDir(dir);
  registerPacks(loaded);
  // The placeholder only exists so the guide runs with no packs at all. Its URL patterns overlap the
  // real mock-portal packs, and the first match wins, so it must go as soon as a real pack loads.
  if (loaded.length > 0) delete PACKS[placeholderPack.id];
  return Object.keys(PACKS);
}

export async function listPacks(): Promise<SkillPack[]> {
  return Object.values(PACKS);
}
export async function fetchLatestPack(skillId: string): Promise<SkillPack> {
  const pack = PACKS[skillId];
  if (!pack) throw new Error("PACK_NOT_FOUND");
  return pack;
}
// An objective is a task of a pack.
export async function fetchObjectiveRecord(skillId: string, taskId: string): Promise<Objective> {
  const pack = await fetchLatestPack(skillId);
  const task = pack.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("OBJECTIVE_NOT_FOUND");
  return { id: task.id, courseId: pack.id, title: task.title, description: task.description ?? "", skill: pack.id, taskId: task.id };
}

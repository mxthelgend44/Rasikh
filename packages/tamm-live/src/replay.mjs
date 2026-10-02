/** Recorded runs: replay/<id>.json. Written atomically; read back through the sanitizer. */
import fs from "node:fs/promises";
import path from "node:path";
import { sanitize } from "./redact.mjs";
import { SCENARIOS } from "./scenarios.mjs";

const valid = (id) => SCENARIOS.some((s) => s.id === id);

export async function saveReplay(dir, id, steps, done) {
  if (!valid(id)) throw new Error("unknown scenario");
  await fs.mkdir(dir, { recursive: true });
  const record = { schema: 1, scenario: id, recordedAt: new Date().toISOString(), mock: true, steps: sanitize(steps), done };
  const file = path.join(dir, `${id}.json`);
  const tmp = `${file}.${process.pid}.tmp`;
  await fs.writeFile(tmp, `${JSON.stringify(record, null, 2)}\n`, "utf8");
  await fs.rename(tmp, file);
  return file;
}

/** Returns the record or null when missing or unusable. */
export async function loadReplay(dir, id) {
  if (!valid(id)) return null;
  try {
    const record = JSON.parse(await fs.readFile(path.join(dir, `${id}.json`), "utf8"));
    if (!record || !Array.isArray(record.steps) || !record.done || typeof record.done.outcome !== "string") return null;
    return { ...record, steps: sanitize(record.steps) };
  } catch {
    return null;
  }
}

export async function listReplays(dir) {
  const found = [];
  for (const s of SCENARIOS) if (await loadReplay(dir, s.id)) found.push(s.id);
  return found;
}

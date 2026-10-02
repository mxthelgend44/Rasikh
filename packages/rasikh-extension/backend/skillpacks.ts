// backend/skillpacks.ts
import { fetchLatestPack, listPacks } from "./data";
import { providerName } from "./provider";

// GET /skills -> summaries for the panel launcher, plus which provider is active
export async function listSkillPacks(_req: any, res: any) {
  const packs = await listPacks();
  res.json({
    provider: providerName(),
    packs: packs.map((p) => ({
      id: p.id,
      name: p.name ?? p.id,
      nameAr: p.nameAr,
      status: p.status,
      tasks: p.tasks.map((t) => ({ id: t.id, title: t.title, titleAr: t.titleAr, steps: t.steps.length }))
    }))
  });
}

// GET /skills/:site -> one full pack
export async function getSkillPack(req: any, res: any) {
  try {
    res.json(await fetchLatestPack(req.params.site));
  } catch {
    res.status(404).json({ error: { code: "NOT_FOUND", message: "Unknown skill pack", retryable: false } });
  }
}

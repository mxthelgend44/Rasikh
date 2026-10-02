// backend/server.ts  (Express; local only)
// No accounts, no auth, no CORS: it is bound to 127.0.0.1 by server.local.ts and the extension reaches
// it through its own host_permissions (http://localhost:8796/*). It is a development and demo
// backend, not something to expose to a network.
import express from "express";
import { agentTurn } from "./agentTurn";
import { getSkillPack, listSkillPacks } from "./skillpacks";
import { providerName } from "./provider";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" })); // structure-only page models are small

app.get("/health", (_req, res) => res.json({ ok: true, provider: providerName() }));
app.get("/skills", listSkillPacks);
app.get("/skills/:site", getSkillPack);
app.post("/agent/turn", agentTurn); // streams SSE

export default app;

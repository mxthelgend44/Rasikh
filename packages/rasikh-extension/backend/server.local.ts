// backend/server.local.ts
// Local entry: `npm run dev:backend`. Port 8796 (the Eduverse default clashed with Guard, so it moved).
// Default is the OFFLINE demo guide. The AI path needs ANTHROPIC_KEY and is labelled "AI" in the panel.
import app from "./server";
import { initPacks } from "./data";
import { providerName } from "./provider";

const PORT = Number(process.env.PORT ?? 8796);
const HOST = process.env.HOST ?? "127.0.0.1";

initPacks().then((ids) => {
  app.listen(PORT, HOST, () => {
    console.log(`Rasikh Guide backend listening on http://localhost:${PORT} (packs: ${ids.join(", ")})`);
    if (providerName() === "demo") {
      console.log("Model provider: demo guide (offline, deterministic, no network call).");
    } else {
      console.warn("Model provider: AI (ANTHROPIC_KEY is set). Page structure goes to the model provider.");
    }
  });
});

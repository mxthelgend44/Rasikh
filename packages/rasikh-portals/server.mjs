// Rasikh MOCK portals: a zero-dependency static server for three clearly labelled mock websites.
// Listens on 127.0.0.1 only. GET and HEAD only. No directory traversal. Nothing is ever stored or forwarded.
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, extname, join, normalize, resolve, sep } from "node:path";

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), "public"));
const HOST = "127.0.0.1";
const PORT = Number(process.env.PORTALS_PORT ?? 8793);

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8"
};

const NOT_FOUND = `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Not found - MOCK portal</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<style>body{font:18px/1.5 system-ui,sans-serif;background:#FBF4E6;color:#173C47;margin:0}
.b{background:#E4AD42;padding:12px 16px;font-weight:700}main{padding:32px 16px;max-width:40rem;margin:auto}a{color:#0B6B78}</style></head>
<body><div class="b" role="note">MOCK PORTAL for the Rasikh demo, not a real government or bank site</div>
<main><h1>Page not found</h1><p>This mock server has no such page.</p><p><a href="/">Back to the list of mock portals</a></p></main></body></html>`;

/** Resolve a request path to a file inside ROOT, or null. Rejects traversal, NUL bytes and encoded separators. */
export function resolveSafe(rawPath) {
  let p;
  try {
    p = decodeURIComponent(rawPath);
  } catch {
    return null;
  }
  if (p.includes("\0") || p.includes("\\")) return null;
  const parts = p.split("/").filter((s) => s !== "");
  if (parts.some((s) => s === ".." || s === ".")) return null;
  const target = resolve(join(ROOT, normalize(p)));
  if (target !== ROOT && !target.startsWith(ROOT + sep)) return null;
  return target;
}

async function pickFile(target) {
  let s = await stat(target).catch(() => null);
  if (s?.isDirectory()) {
    target = join(target, "index.html");
    s = await stat(target).catch(() => null);
  }
  return s?.isFile() ? target : null;
}

export function createPortalServer() {
  return createServer(async (req, res) => {
    const headers = {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Referrer-Policy": "no-referrer",
      "X-Frame-Options": "DENY"
    };
    try {
      if (req.method !== "GET" && req.method !== "HEAD") {
        res.writeHead(405, { ...headers, Allow: "GET, HEAD" });
        return res.end("Method not allowed");
      }
      const url = new URL(req.url ?? "/", `http://${HOST}`);
      const target = resolveSafe(url.pathname);
      if (!target) {
        res.writeHead(400, { ...headers, "Content-Type": TYPES[".txt"] });
        return res.end("Bad path");
      }
      // a directory URL without a trailing slash would break relative links: redirect
      const s0 = await stat(target).catch(() => null);
      if (s0?.isDirectory() && !url.pathname.endsWith("/")) {
        res.writeHead(301, { ...headers, Location: url.pathname + "/" });
        return res.end();
      }
      const file = await pickFile(target);
      if (!file) {
        res.writeHead(404, { ...headers, "Content-Type": TYPES[".html"] });
        return res.end(req.method === "HEAD" ? undefined : NOT_FOUND);
      }
      const body = await readFile(file);
      res.writeHead(200, { ...headers, "Content-Type": TYPES[extname(file).toLowerCase()] ?? "application/octet-stream", "Content-Length": body.length });
      res.end(req.method === "HEAD" ? undefined : body);
    } catch {
      res.writeHead(500, { ...headers, "Content-Type": TYPES[".txt"] });
      res.end("Server error");
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const server = createPortalServer();
  server.listen(PORT, HOST, () => {
    console.log(`Rasikh MOCK portals on http://${HOST}:${PORT}/  (icp/, utilities/, bank/)`);
  });
}

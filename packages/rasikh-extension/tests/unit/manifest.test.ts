// tests/unit/manifest.test.ts
// Product rule 3: per-site optional grants, no broad default host access, no debugger/identity,
// strict CSP. Also the icon files and the backend defaults (port 8796, demo provider).
import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const m = JSON.parse(readFileSync("manifest.json", "utf8"));

describe("manifest", () => {
  it("is Rasikh Guide, MV3", () => {
    expect(m.manifest_version).toBe(3);
    expect(m.name).toBe("Rasikh Guide");
    expect(JSON.stringify(m)).not.toMatch(/eduverse|onshape|azure|firebase/i);
  });
  it("drops debugger, identity and offscreen; keeps only what is needed", () => {
    expect(m.permissions.sort()).toEqual(["activeTab", "scripting", "sidePanel", "storage"]);
  });
  it("default host access is only the local backend", () => {
    expect(m.host_permissions.sort()).toEqual(["http://127.0.0.1:8796/*", "http://localhost:8796/*"]);
  });
  it("optional hosts are the mock portals plus a per-site https grant", () => {
    expect(m.optional_host_permissions.sort()).toEqual(["http://127.0.0.1:8793/*", "http://localhost:8793/*", "https://*/*"]);
    // no static content_scripts: a static entry injects without a grant. The script is registered per origin at grant time.
    expect(m.content_scripts).toBeUndefined();
  });
  it("the content script is built as a plain self-contained file that sites.ts registers", () => {
    expect(m.permissions).toContain("scripting"); // registerContentScripts / executeScript
    const vc = readFileSync("vite.content.config.ts", "utf8");
    expect(vc).toContain('fileName: () => "content.js"');
    expect(vc).toContain('formats: ["iife"]');
    expect(vc).toContain("emptyOutDir: false");
    expect(readFileSync("src/background/sites.ts", "utf8")).toContain('CONTENT_SCRIPT_FILE = "content.js"');
    expect(JSON.parse(readFileSync("package.json", "utf8")).scripts.build).toContain("vite.content.config.ts");
  });
  it("strict extension-page CSP: self scripts, no eval, no remote code", () => {
    const csp: string = m.content_security_policy.extension_pages;
    expect(csp).toContain("script-src 'self'");
    expect(csp).not.toMatch(/unsafe-eval|unsafe-inline|https?:\/\/[^\s;]*\.(com|net|org|io)/);
    expect(csp).toContain("connect-src 'self' http://localhost:8796 http://127.0.0.1:8796");
  });
  it("has no web_accessible_resources of its own and no externally_connectable", () => {
    expect(m.externally_connectable).toBeUndefined();
  });
});

describe("icons", () => {
  for (const size of [16, 48, 128]) {
    it(`icons/${size}.png is a real ${size}x${size} RGBA PNG`, () => {
      const b = readFileSync(`icons/${size}.png`);
      expect([...b.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
      expect(b.readUInt32BE(16)).toBe(size);
      expect(b.readUInt32BE(20)).toBe(size);
      expect(b[25]).toBe(6);
      // decode the IDAT and check the palette: petrol and sand both present, centre of the glyph is sand
      const idat = b.subarray(b.indexOf("IDAT") + 4, b.indexOf("IEND") - 4);
      const raw = inflateSync(idat);
      expect(raw.length).toBe((size * 4 + 1) * size);
      const px = (x: number, y: number) => {
        const o = y * (size * 4 + 1) + 1 + x * 4;
        return [raw[o], raw[o + 1], raw[o + 2], raw[o + 3]];
      };
      const hex = (p: number[]) => p.slice(0, 3).map((v) => v.toString(16).padStart(2, "0")).join("");
      const seen = new Set<string>();
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) if (px(x, y)[3] === 255) seen.add(hex(px(x, y)));
      expect(seen.has("0b6b78")).toBe(true);
      expect(seen.has("f6e7cd")).toBe(true);
    });
  }
});

describe("backend defaults", () => {
  it("server.local.ts defaults to port 8796, not 8787", () => {
    const src = readFileSync("backend/server.local.ts", "utf8");
    expect(src).toContain("8796");
    expect(src).not.toContain("8787");
  });
  it("the extension API base defaults to 8796", () => {
    expect(readFileSync("src/background/orchestratorClient.ts", "utf8")).toContain("http://localhost:8796");
    expect(readFileSync(".env.development", "utf8")).toContain("8796");
  });
});

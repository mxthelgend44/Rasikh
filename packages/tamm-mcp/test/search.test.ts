import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MockTammBackend } from "../src/backend/mock/mockBackend.js";
import { SearchIndex } from "../src/backend/mock/search.js";
import { editDistance, normalise, tokenize } from "../src/backend/mock/text.js";

const backend = new MockTammBackend({ progression: { mode: "demo" } });
const top = async (query: string, audience: "individual" | "business" = "individual") =>
  (await backend.searchServices(query, audience))[0]?.service_id;

describe("text normalisation", () => {
  it("unifies Arabic letter variants and strips marks and the article", () => {
    assert.equal(normalise("إقامَة"), normalise("اقامه"));
    assert.deepEqual(tokenize("الإقامة"), tokenize("اقامه"));
    assert.deepEqual(tokenize("Café Licence-2026"), ["cafe", "licence", "2026"]);
  });

  it("computes capped optimal string alignment distance", () => {
    assert.equal(editDistance("licence", "license", 2), 1);
    assert.equal(editDistance("tenancy", "tenacny", 1), 1, "a transposition costs one");
    assert.equal(editDistance("school", "insurance", 1), 2, "stops once the cap is exceeded");
    assert.equal(editDistance("visa", "visa", 1), 0);
  });
});

describe("BM25 service search", () => {
  it("ranks the obvious service first for plain English", async () => {
    assert.equal(await top("tenancy contract"), "svc_tawtheeq_register");
    assert.equal(await top("health insurance"), "svc_health_insurance");
    assert.equal(await top("school for my kids"), "svc_school_registration");
    assert.equal(await top("trade name", "business"), "svc_trade_name");
  });

  it("understands Arabic and common transliterations", async () => {
    assert.equal(await top("iqama"), "svc_residency_visa");
    assert.equal(await top("إقامة"), "svc_residency_visa");
    assert.equal(await top("هوية"), "svc_emirates_id");
    assert.equal(await top("عقد إيجار"), "svc_tawtheeq_register");
    assert.equal(await top("تأمين صحي"), "svc_health_insurance");
    assert.equal(await top("اسم تجاري", "business"), "svc_trade_name");
  });

  it("tolerates one typo in longer words", async () => {
    assert.equal(await top("tenacny"), "svc_tawtheeq_register");
    assert.equal(await top("insurence"), "svc_health_insurance");
  });

  it("scores in descending order, never mixes audiences, and drops non-matches", async () => {
    const results = await backend.searchServices("free zone licence", "business");
    assert.ok(results.length >= 4);
    assert.ok(results.every((result, i) => i === 0 || (results[i - 1]?.score ?? 0) >= result.score));
    assert.ok(results.every((result) => result.audience === "business" && result.score > 0));
    assert.deepEqual(await backend.searchServices("zzzz qqqq", "individual"), []);
  });

  it("returns every service in the audience for an empty query, unscored", async () => {
    const all = await backend.searchServices("  ", "individual");
    assert.equal(all.length, 5);
    assert.ok(all.every((result) => result.score === 0));
  });

  it("rewards rarer terms more (inverse document frequency)", () => {
    const index = new SearchIndex(
      [
        { id: "a", keywords: ["visa", "common"], name: "A", tags: [], entity: "x" },
        { id: "b", keywords: ["visa", "rare"], name: "B", tags: [], entity: "x" },
        { id: "c", keywords: ["common"], name: "C", tags: [], entity: "x" },
      ],
      [],
    );
    const [first] = index.search("visa rare common");
    assert.equal(first?.id, "b");
  });
});

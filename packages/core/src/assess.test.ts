import { describe, expect, test } from "vitest";
import { assessManyWith, assessWith, type AssessDeps } from "./assess.js";
import type { EcosystemAdapter, PackageMetadata } from "./types.js";

function fakeAdapter(opts: {
  exists?: boolean;
  meta?: PackageMetadata;
  throwOnExists?: boolean;
}): EcosystemAdapter {
  return {
    ecosystem: "npm",
    async exists() {
      if (opts.throwOnExists) throw new Error("network down");
      return opts.exists ?? true;
    },
    async getMetadata() {
      return opts.meta ?? {};
    },
  };
}

const at = new Date("2026-06-16T00:00:00Z");
const deps = (adapter: EcosystemAdapter): AssessDeps => ({ adapter, now: at });

describe("assessWith", () => {
  test("non-existent package is phantom", async () => {
    const r = await assessWith("totally-made-up-xyz", deps(fakeAdapter({ exists: false })));
    expect(r.verdict).toBe("phantom");
    expect(r.reasons.join(" ")).toMatch(/not found/i);
  });

  test("ordinary existing package is ok", async () => {
    const r = await assessWith(
      "react",
      deps(fakeAdapter({ exists: true, meta: { firstPublished: "2015-01-01", downloads: 9_000_000 } })),
    );
    expect(r.verdict).toBe("ok");
  });

  test("existing blocklisted package is suspicious", async () => {
    const r = await assessWith("flask-gpt-helper", deps(fakeAdapter({ exists: true })));
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons.join(" ")).toMatch(/blocklist/i);
  });

  test("recently published + low adoption is suspicious", async () => {
    const r = await assessWith(
      "obscure-new-thing",
      deps(fakeAdapter({ exists: true, meta: { firstPublished: "2026-06-12", downloads: 3 } })),
    );
    expect(r.verdict).toBe("suspicious");
  });

  test("lookup failure degrades to suspicious, never crashes", async () => {
    const r = await assessWith("anything", deps(fakeAdapter({ throwOnExists: true })));
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons.join(" ")).toMatch(/verify/i);
  });

  // Bug 5 regression: verify suspicious detection against a controlled, fabricated
  // package (AI-style name, just published, near-zero adoption) rather than a live
  // registry — real package metadata changes and isn't a reliable test fixture.
  test("AI-style name, newly published, near-zero downloads is suspicious", async () => {
    const r = await assessWith(
      "gpt-data-helper",
      deps(fakeAdapter({ exists: true, meta: { firstPublished: "2026-06-12", downloads: 2 } })),
    );
    expect(r.verdict).toBe("suspicious");
    expect(r.reasons.join(" ")).toMatch(/low adoption/i);
  });
});

describe("assessManyWith", () => {
  test("returns one assessment per input, in order", async () => {
    const results = await assessManyWith(["a", "b", "c"], deps(fakeAdapter({ exists: false })));
    expect(results.map((r) => r.name)).toEqual(["a", "b", "c"]);
    expect(results.every((r) => r.verdict === "phantom")).toBe(true);
  });
});

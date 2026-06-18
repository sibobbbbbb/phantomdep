import { describe, expect, test } from "vitest";
import type { Assessment } from "@phantomdep/core";
import { summarize } from "./summarize.js";

const a = (over: Partial<Assessment>): Assessment => ({
  name: "x",
  ecosystem: "npm",
  verdict: "ok",
  reasons: [],
  ...over,
});

describe("summarize", () => {
  test("emits exactly name, verdict, reason per package (no metadata dump)", () => {
    const out = summarize([a({ name: "react", verdict: "ok", reasons: ["verified on npm"] })]);
    expect(out).toEqual([{ name: "react", verdict: "ok", reason: "verified on npm" }]);
  });

  test("collapses multiple reasons to a single short string", () => {
    const out = summarize([
      a({ name: "p", verdict: "suspicious", reasons: ["on community blocklist", "low adoption"] }),
    ]);
    expect(out[0]!.reason).toBe("on community blocklist");
    expect(Object.keys(out[0]!)).toEqual(["name", "verdict", "reason"]);
  });

  test("provides a fallback reason when none given", () => {
    const out = summarize([a({ name: "p", verdict: "phantom", reasons: [] })]);
    expect(typeof out[0]!.reason).toBe("string");
    expect(out[0]!.reason.length).toBeGreaterThan(0);
  });
});

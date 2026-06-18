import { describe, expect, test } from "vitest";
import { mergeEntries } from "./merge.js";

describe("mergeEntries", () => {
  test("dedupes by name (case-insensitive) keeping the existing entry", () => {
    const out = mergeEntries(
      [{ name: "flask-gpt-helper", source: "research" }],
      [{ name: "Flask-GPT-Helper", source: "dupe" }, { name: "new-phantom", source: "report" }],
    );
    expect(out).toHaveLength(2);
    const flask = out.find((e) => e.name === "flask-gpt-helper");
    expect(flask?.source).toBe("research");
  });

  test("returns entries sorted by name", () => {
    const out = mergeEntries([], [{ name: "zeta", source: "s" }, { name: "alpha", source: "s" }]);
    expect(out.map((e) => e.name)).toEqual(["alpha", "zeta"]);
  });
});

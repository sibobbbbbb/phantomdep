import { describe, expect, test } from "vitest";
import { closestPopular, similarity } from "./similarity.js";

describe("similarity (Jaro-Winkler)", () => {
  test("identical strings score 1", () => {
    expect(similarity("requests", "requests")).toBe(1);
  });

  test("a single transposition scores high", () => {
    expect(similarity("reqeusts", "requests")).toBeGreaterThan(0.85);
  });

  test("unrelated strings score low", () => {
    expect(similarity("react", "tensorflow")).toBeLessThan(0.6);
  });
});

describe("closestPopular", () => {
  test("matches a typosquat to its popular target", () => {
    const hit = closestPopular("reqeusts", "pypi");
    expect(hit?.name).toBe("requests");
    expect(hit?.score).toBeGreaterThan(0.85);
  });

  test("does not self-match an identical popular name", () => {
    const hit = closestPopular("react", "npm");
    expect(hit?.score).not.toBe(1);
  });

  test("returns a low score for a clearly novel name", () => {
    const hit = closestPopular("zzqwxkcd-novel", "npm");
    expect(hit && hit.score).toBeLessThan(0.85);
  });
});

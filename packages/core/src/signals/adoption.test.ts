import { describe, expect, test } from "vitest";
import { defaultThresholds } from "../config.js";
import { isLowAdoption, isRecentlyPublished } from "./adoption.js";

const now = new Date("2026-06-16T00:00:00Z");

describe("isRecentlyPublished", () => {
  test("true when published within the threshold window", () => {
    expect(isRecentlyPublished("2026-06-10", defaultThresholds, now)).toBe(true);
  });

  test("false for an old package", () => {
    expect(isRecentlyPublished("2020-01-01", defaultThresholds, now)).toBe(false);
  });

  test("false when publish date is unknown", () => {
    expect(isRecentlyPublished(undefined, defaultThresholds, now)).toBe(false);
  });
});

describe("isLowAdoption", () => {
  test("true when downloads at or below threshold", () => {
    expect(isLowAdoption(5, defaultThresholds)).toBe(true);
  });

  test("false for a widely-used package", () => {
    expect(isLowAdoption(100_000, defaultThresholds)).toBe(false);
  });

  test("false when downloads are unknown", () => {
    expect(isLowAdoption(undefined, defaultThresholds)).toBe(false);
  });
});

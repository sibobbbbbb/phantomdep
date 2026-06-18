import { describe, expect, test } from "vitest";
import { matchedLlmPatterns } from "./naming.js";

describe("matchedLlmPatterns", () => {
  test("flags a classic hallucinated suffix", () => {
    expect(matchedLlmPatterns("flask-gpt-helper")).toContain("-helper");
  });

  test("flags ai- prefix case-insensitively", () => {
    expect(matchedLlmPatterns("AI-toolkit")).toContain("ai-");
  });

  test("returns empty array for a normal package name", () => {
    expect(matchedLlmPatterns("react")).toEqual([]);
  });

  test("can match multiple patterns in one name", () => {
    const hits = matchedLlmPatterns("gpt-openai-sdk");
    expect(hits).toContain("gpt-");
    expect(hits).toContain("-sdk");
  });
});

import { describe, expect, test } from "vitest";
import { isBlocklisted, loadBlocklist } from "./index.js";

describe("loadBlocklist", () => {
  test("loads npm blocklist entries as a lowercase Set", () => {
    const set = loadBlocklist("npm");
    expect(set.has("flask-gpt-helper")).toBe(true);
  });

  test("loads pypi blocklist separately from npm", () => {
    const pypi = loadBlocklist("pypi");
    expect(pypi.has("requests-ai-sdk")).toBe(true);
    expect(pypi.has("react-ai-utils")).toBe(false);
  });
});

describe("isBlocklisted", () => {
  test("returns true for a known hallucinated npm name", () => {
    expect(isBlocklisted("flask-gpt-helper", "npm")).toBe(true);
  });

  test("returns false for a legitimate package", () => {
    expect(isBlocklisted("react", "npm")).toBe(false);
  });

  test("matches case-insensitively", () => {
    expect(isBlocklisted("Flask-GPT-Helper", "npm")).toBe(true);
  });
});

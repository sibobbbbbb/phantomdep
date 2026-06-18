import { llmNamingPatterns } from "../config.js";

/** Returns the LLM-naming patterns present in a package name (case-insensitive). */
export function matchedLlmPatterns(name: string): string[] {
  const lower = name.toLowerCase();
  return llmNamingPatterns.filter((p) => lower.includes(p));
}

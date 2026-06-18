import type { Assessment } from "@phantomdep/core";

const icon = { ok: "ok ", suspicious: "WARN", phantom: "BLOCK" } as const;

/** One short line per package: "<tag> name — reason". */
export function formatAssessment(a: Assessment): string {
  return `  [${icon[a.verdict]}] ${a.name} — ${a.reasons[0] ?? a.verdict}`;
}

export function report(assessments: Assessment[]): string {
  return assessments.map(formatAssessment).join("\n");
}

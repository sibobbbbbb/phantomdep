import type { Assessment, Verdict } from "@phantomdep/core";

/** The entire MCP tool payload per package — deliberately tiny. */
export interface PackageVerdict {
  name: string;
  verdict: Verdict;
  reason: string;
}

const fallback: Record<Verdict, string> = {
  ok: "verified",
  suspicious: "flagged as suspicious",
  phantom: "not found on registry",
};

/**
 * Reduce full assessments to minimal verdicts. One short reason per package,
 * never the full reason array or metadata — keeps the agent's context small.
 */
export function summarize(assessments: Assessment[]): PackageVerdict[] {
  return assessments.map(({ name, verdict, reasons }) => ({
    name,
    verdict,
    reason: reasons[0] ?? fallback[verdict],
  }));
}

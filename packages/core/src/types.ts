export type Ecosystem = "npm" | "pypi";
export type Verdict = "ok" | "suspicious" | "phantom";

export interface Assessment {
  name: string;
  ecosystem: Ecosystem;
  verdict: Verdict;
  reasons: string[];
}

/** Registry metadata for a package, normalized across ecosystems. */
export interface PackageMetadata {
  /** ISO date string of first publication, if known. */
  firstPublished?: string;
  /** Total downloads in a recent window (e.g. last week/month), if known. */
  downloads?: number;
}

/**
 * Per-ecosystem registry access. npm and PyPI are two implementations;
 * a third (crates.io, Go) can be added without touching core logic.
 */
export interface EcosystemAdapter {
  readonly ecosystem: Ecosystem;
  /** True if the package name exists on the registry. */
  exists(name: string): Promise<boolean>;
  /** Best-effort metadata; absent fields mean "unknown", never crash a batch. */
  getMetadata(name: string): Promise<PackageMetadata>;
}

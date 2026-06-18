import { isBlocklisted } from "@phantomdep/blocklist";
import { defaultThresholds, type Thresholds } from "./config.js";
import { isLowAdoption, isRecentlyPublished } from "./signals/adoption.js";
import { matchedLlmPatterns } from "./signals/naming.js";
import { closestPopular } from "./signals/similarity.js";
import { createNpmAdapter } from "./adapters/npm.js";
import { createPypiAdapter } from "./adapters/pypi.js";
import type { Assessment, Ecosystem, EcosystemAdapter } from "./types.js";

export interface AssessDeps {
  adapter: EcosystemAdapter;
  thresholds?: Thresholds;
  now?: Date;
}

const registryName: Record<Ecosystem, string> = { npm: "npm", pypi: "PyPI" };

/** Core verdict logic for a single name, with injected dependencies (testable). */
export async function assessWith(name: string, deps: AssessDeps): Promise<Assessment> {
  const { adapter } = deps;
  const thresholds = deps.thresholds ?? defaultThresholds;
  const ecosystem = adapter.ecosystem;
  const reg = registryName[ecosystem];

  let exists: boolean;
  try {
    exists = await adapter.exists(name);
  } catch {
    return {
      name,
      ecosystem,
      verdict: "suspicious",
      reasons: [`could not verify on ${reg} (lookup failed)`],
    };
  }

  if (!exists) {
    return { name, ecosystem, verdict: "phantom", reasons: [`not found on ${reg}`] };
  }

  const reasons: string[] = [];

  if (isBlocklisted(name, ecosystem)) {
    reasons.push("on community blocklist of hallucinated names");
  }

  let meta = {};
  try {
    meta = await adapter.getMetadata(name);
  } catch {
    // metadata is best-effort; absence simply means those signals don't fire
  }
  const m = meta as { firstPublished?: string; downloads?: number };

  if (isRecentlyPublished(m.firstPublished, thresholds, deps.now) && isLowAdoption(m.downloads, thresholds)) {
    reasons.push("recently published with very low adoption");
  }

  const patterns = matchedLlmPatterns(name);
  const popular = closestPopular(name, ecosystem);
  if (patterns.length > 0 && popular && popular.score >= thresholds.typosquatMinSimilarity) {
    reasons.push(`AI-style name closely resembles "${popular.name}"`);
  }

  if (reasons.length > 0) {
    return { name, ecosystem, verdict: "suspicious", reasons };
  }
  return { name, ecosystem, verdict: "ok", reasons: [`verified on ${reg}`] };
}

/** Batched variant of {@link assessWith}; never lets one failure sink the batch. */
export async function assessManyWith(names: string[], deps: AssessDeps): Promise<Assessment[]> {
  return Promise.all(names.map((n) => assessWith(n, deps)));
}

function adapterFor(ecosystem: Ecosystem): EcosystemAdapter {
  return ecosystem === "npm" ? createNpmAdapter() : createPypiAdapter();
}

/** Assess a single package name against the live registry. */
export function assess(name: string, ecosystem: Ecosystem): Promise<Assessment> {
  return assessWith(name, { adapter: adapterFor(ecosystem) });
}

/** Assess many package names against the live registry. */
export function assessMany(names: string[], ecosystem: Ecosystem): Promise<Assessment[]> {
  return assessManyWith(names, { adapter: adapterFor(ecosystem) });
}

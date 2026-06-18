import { popularPackages } from "../config.js";
import type { Ecosystem } from "../types.js";

/** Jaro similarity (0..1). */
function jaro(a: string, b: string): number {
  if (a === b) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const matchWindow = Math.max(0, Math.floor(Math.max(a.length, b.length) / 2) - 1);
  const aMatches = new Array<boolean>(a.length).fill(false);
  const bMatches = new Array<boolean>(b.length).fill(false);

  let matches = 0;
  for (let i = 0; i < a.length; i++) {
    const start = Math.max(0, i - matchWindow);
    const end = Math.min(i + matchWindow + 1, b.length);
    for (let j = start; j < end; j++) {
      if (bMatches[j] || a[i] !== b[j]) continue;
      aMatches[i] = true;
      bMatches[j] = true;
      matches++;
      break;
    }
  }
  if (matches === 0) return 0;

  let transpositions = 0;
  let k = 0;
  for (let i = 0; i < a.length; i++) {
    if (!aMatches[i]) continue;
    while (!bMatches[k]) k++;
    if (a[i] !== b[k]) transpositions++;
    k++;
  }
  transpositions /= 2;

  return (matches / a.length + matches / b.length + (matches - transpositions) / matches) / 3;
}

/** Jaro-Winkler similarity (0..1), favoring a common prefix. */
export function similarity(a: string, b: string): number {
  const s1 = a.toLowerCase();
  const s2 = b.toLowerCase();
  const j = jaro(s1, s2);
  let prefix = 0;
  while (prefix < 4 && prefix < s1.length && prefix < s2.length && s1[prefix] === s2[prefix]) {
    prefix++;
  }
  return j + prefix * 0.1 * (1 - j);
}

export interface PopularMatch {
  name: string;
  score: number;
}

/** Closest popular package to `name` (excluding an identical name), or null. */
export function closestPopular(name: string, ecosystem: Ecosystem): PopularMatch | null {
  const lower = name.toLowerCase();
  let best: PopularMatch | null = null;
  for (const candidate of popularPackages[ecosystem]) {
    if (candidate.toLowerCase() === lower) continue;
    const score = similarity(lower, candidate);
    if (!best || score > best.score) best = { name: candidate, score };
  }
  return best;
}

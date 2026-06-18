import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type Ecosystem = "npm" | "pypi";

export interface BlocklistEntry {
  name: string;
  source: string;
  note?: string;
}

interface BlocklistFile {
  ecosystem: Ecosystem;
  updated: string;
  entries: BlocklistEntry[];
}

const cache = new Map<Ecosystem, Set<string>>();

function readData(ecosystem: Ecosystem): BlocklistFile {
  const path = fileURLToPath(new URL(`../data/${ecosystem}.json`, import.meta.url));
  return JSON.parse(readFileSync(path, "utf8")) as BlocklistFile;
}

export function loadBlocklist(ecosystem: Ecosystem): Set<string> {
  const cached = cache.get(ecosystem);
  if (cached) return cached;
  const set = new Set(readData(ecosystem).entries.map((e) => e.name.toLowerCase()));
  cache.set(ecosystem, set);
  return set;
}

export function isBlocklisted(name: string, ecosystem: Ecosystem): boolean {
  return loadBlocklist(ecosystem).has(name.toLowerCase());
}

export { mergeEntries } from "./merge.js";

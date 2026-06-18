import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { mergeEntries } from "../merge.js";
import type { BlocklistEntry } from "../index.js";

/**
 * Merge community-contributed names from `sources/<eco>.json` into the bundled
 * `data/<eco>.json`. No runtime network dependency — this runs in CI only, on a
 * schedule, and opens a PR. Add new sources by appending to sources/<eco>.json.
 */
const ECOSYSTEMS = ["npm", "pypi"] as const;

function pathTo(rel: string): string {
  return fileURLToPath(new URL(`../../${rel}`, import.meta.url));
}

function readEntries(path: string): BlocklistEntry[] {
  if (!existsSync(path)) return [];
  return JSON.parse(readFileSync(path, "utf8")) as BlocklistEntry[];
}

function run(): void {
  const today = new Date().toISOString().slice(0, 10);
  for (const eco of ECOSYSTEMS) {
    const dataPath = pathTo(`data/${eco}.json`);
    const data = JSON.parse(readFileSync(dataPath, "utf8")) as {
      ecosystem: string;
      updated: string;
      entries: BlocklistEntry[];
    };
    const incoming = readEntries(pathTo(`sources/${eco}.json`));
    const merged = mergeEntries(data.entries, incoming);
    const next = { ecosystem: eco, updated: today, entries: merged };
    writeFileSync(dataPath, `${JSON.stringify(next, null, 2)}\n`);
    process.stdout.write(`${eco}: ${merged.length} entries (was ${data.entries.length})\n`);
  }
}

run();

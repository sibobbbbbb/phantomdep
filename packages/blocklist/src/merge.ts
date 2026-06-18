import type { BlocklistEntry } from "./index.js";

/**
 * Merge incoming blocklist entries into existing ones: dedupe by lowercased
 * name (existing wins), then sort by name. Pure — used by the update script.
 */
export function mergeEntries(
  existing: BlocklistEntry[],
  incoming: BlocklistEntry[],
): BlocklistEntry[] {
  const byName = new Map<string, BlocklistEntry>();
  for (const e of incoming) byName.set(e.name.toLowerCase(), e);
  for (const e of existing) byName.set(e.name.toLowerCase(), e); // existing overrides
  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name));
}

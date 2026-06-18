import type { Thresholds } from "../config.js";

const MS_PER_DAY = 1000 * 60 * 60 * 24;

/** True if the package was first published within the "new" window. Unknown => false. */
export function isRecentlyPublished(
  firstPublished: string | undefined,
  thresholds: Thresholds,
  now: Date = new Date(),
): boolean {
  if (!firstPublished) return false;
  const published = new Date(firstPublished);
  if (Number.isNaN(published.getTime())) return false;
  const ageDays = (now.getTime() - published.getTime()) / MS_PER_DAY;
  return ageDays <= thresholds.newPackageMaxAgeDays;
}

/** True if recent downloads are at or below the low-adoption threshold. Unknown => false. */
export function isLowAdoption(downloads: number | undefined, thresholds: Thresholds): boolean {
  if (downloads === undefined) return false;
  return downloads <= thresholds.lowAdoptionMaxDownloads;
}

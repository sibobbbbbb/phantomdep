import { readFile, stat } from "node:fs/promises";
import { basename, join } from "node:path";
import { assessMany } from "./assess.js";
import type { Assessment, Ecosystem } from "./types.js";

/** Lockfiles we can parse, in the order we prefer them inside a directory. */
const SUPPORTED_LOCKFILES = ["package-lock.json", "npm-shrinkwrap.json", "requirements.txt"];

export interface ExtractResult {
  ecosystem: Ecosystem;
  names: string[];
}

/** Take the package name from a node_modules lockfile key (handles scopes + nesting). */
function nameFromNodeModulesKey(key: string): string | null {
  const idx = key.lastIndexOf("node_modules/");
  if (idx === -1) return null;
  const name = key.slice(idx + "node_modules/".length);
  return name.length > 0 ? name : null;
}

function walkDependencyTree(
  deps: Record<string, { dependencies?: Record<string, unknown> }> | undefined,
  out: Set<string>,
): void {
  if (!deps) return;
  for (const [name, node] of Object.entries(deps)) {
    out.add(name);
    walkDependencyTree(node?.dependencies as never, out);
  }
}

function parseNpmLock(contents: string): string[] {
  const json = JSON.parse(contents) as {
    packages?: Record<string, unknown>;
    dependencies?: Record<string, { dependencies?: Record<string, unknown> }>;
  };
  const names = new Set<string>();
  if (json.packages) {
    for (const key of Object.keys(json.packages)) {
      const name = nameFromNodeModulesKey(key);
      if (name) names.add(name);
    }
  }
  walkDependencyTree(json.dependencies, names);
  return [...names];
}

function parseRequirements(contents: string): string[] {
  const names = new Set<string>();
  for (const raw of contents.split(/\r?\n/)) {
    const line = raw.trim();
    if (line === "" || line.startsWith("#") || line.startsWith("-")) continue;
    if (line.includes("://") || line.includes("@")) continue;
    const match = /^[A-Za-z0-9][A-Za-z0-9._-]*/.exec(line);
    if (match) names.add(match[0]);
  }
  return [...names];
}

/** Pure lockfile parser: filename selects the format, contents is the file body. */
export function extractPackages(filename: string, contents: string): ExtractResult {
  const base = basename(filename).toLowerCase();
  if (base === "requirements.txt") {
    return { ecosystem: "pypi", names: parseRequirements(contents) };
  }
  if (base === "package-lock.json" || base === "npm-shrinkwrap.json") {
    return { ecosystem: "npm", names: parseNpmLock(contents) };
  }
  throw new Error(`unsupported lockfile: ${filename}`);
}

/**
 * Resolve a path to an actual lockfile. A file path is returned as-is; a
 * directory is searched for a supported lockfile in priority order. Throws a
 * descriptive error (never a raw EISDIR) when a directory has no lockfile.
 */
export async function resolveLockfile(path: string): Promise<string> {
  const info = await stat(path);
  if (!info.isDirectory()) return path;

  for (const name of SUPPORTED_LOCKFILES) {
    const candidate = join(path, name);
    try {
      if ((await stat(candidate)).isFile()) return candidate;
    } catch {
      // not present — try the next candidate
    }
  }
  throw new Error(`No lockfile found in ${path} (looked for: ${SUPPORTED_LOCKFILES.join(", ")})`);
}

/** Assess the full dependency tree described by a lockfile or project directory. */
export async function assessTree(lockfilePath: string): Promise<Assessment[]> {
  const resolved = await resolveLockfile(lockfilePath);
  const contents = await readFile(resolved, "utf8");
  const { ecosystem, names } = extractPackages(resolved, contents);
  return assessMany(names, ecosystem);
}

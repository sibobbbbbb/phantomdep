import type { Assessment, Ecosystem } from "@phantomdep/core";

/** Format a version string as the CLI's `--version` output. */
export function formatVersion(version: string): string {
  return `phantomdep v${version}`;
}

/**
 * Communicate the CLI's exit code without forcing process.exit().
 *
 * On Windows, calling process.exit() immediately after a registry lookup trips a
 * libuv assertion (`!(handle->flags & UV_HANDLE_CLOSING)`, src\win\async.c) and
 * the process dies with exit 127 instead of the intended code — undici's fetch
 * keep-alive handles are still closing when the forced exit fires. Setting
 * process.exitCode and letting the event loop drain naturally avoids the race;
 * undici unrefs its idle handles, so the process still exits promptly.
 */
export function finalize(code: number): void {
  process.exitCode = code;
}

/** Exit code for `scan`: 1 if any phantom, else 2 if any suspicious, else 0. */
export function scanExitCode(assessments: Assessment[]): number {
  if (assessments.some((a) => a.verdict === "phantom")) return 1;
  if (assessments.some((a) => a.verdict === "suspicious")) return 2;
  return 0;
}

export interface InstallPlan {
  action: "proceed" | "block";
  exitCode: number;
  phantoms: Assessment[];
  suspicious: Assessment[];
}

/**
 * Decide whether an install may proceed.
 * - Any phantom blocks unconditionally (exit 1) — `--force` never unblocks it.
 * - Suspicious blocks (exit 2) unless `--force` is given.
 */
export function planInstall(assessments: Assessment[], force: boolean): InstallPlan {
  const phantoms = assessments.filter((a) => a.verdict === "phantom");
  const suspicious = assessments.filter((a) => a.verdict === "suspicious");

  if (phantoms.length > 0) {
    return { action: "block", exitCode: 1, phantoms, suspicious };
  }
  if (suspicious.length > 0 && !force) {
    return { action: "block", exitCode: 2, phantoms, suspicious };
  }
  return { action: "proceed", exitCode: 0, phantoms, suspicious };
}

export interface Installer {
  ecosystem: Ecosystem;
  command: string;
  installArg: string;
}

/** Infer the real package manager + ecosystem from files present in a project. */
export function detectInstaller(files: string[]): Installer | null {
  const set = new Set(files);
  if (set.has("package.json") || set.has("package-lock.json")) {
    return installerForEcosystem("npm");
  }
  if (set.has("requirements.txt") || set.has("pyproject.toml") || set.has("setup.py")) {
    return installerForEcosystem("pypi");
  }
  return null;
}

/** The real package manager + install verb for a known ecosystem. */
export function installerForEcosystem(ecosystem: Ecosystem): Installer {
  return ecosystem === "pypi"
    ? { ecosystem: "pypi", command: "pip", installArg: "install" }
    : { ecosystem: "npm", command: "npm", installArg: "install" };
}

export interface ParsedInstallArgs {
  packages: string[];
  ecosystem?: Ecosystem;
  force: boolean;
}

function toEcosystem(value: string | undefined): Ecosystem {
  if (value !== "npm" && value !== "pypi") {
    throw new Error(`--ecosystem must be 'npm' or 'pypi', got: ${value ?? "(missing value)"}`);
  }
  return value;
}

/**
 * Parse `install` arguments so option values never leak into the package list,
 * independent of where the flag appears. Returns the packages, optional explicit
 * ecosystem, and the --force flag.
 */
export function parseInstallArgs(args: string[]): ParsedInstallArgs {
  const packages: string[] = [];
  let ecosystem: Ecosystem | undefined;
  let force = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i] as string;
    if (arg === "--force") {
      force = true;
    } else if (arg === "--ecosystem") {
      ecosystem = toEcosystem(args[i + 1]);
      i++; // consume the value so it cannot land in `packages`
    } else if (arg.startsWith("--ecosystem=")) {
      ecosystem = toEcosystem(arg.slice("--ecosystem=".length));
    } else if (arg.startsWith("-")) {
      // unknown flag — ignore rather than treat as a package
    } else {
      packages.push(arg);
    }
  }

  return { packages, ecosystem, force };
}

/**
 * Build the delegated package-manager invocation as a command + real args array
 * (no shell string concatenation). The log line and the spawn call share this
 * single source so the log can never misrepresent what actually runs.
 */
export function buildDelegateCommand(
  installer: Installer,
  packages: string[],
): { command: string; args: string[] } {
  return { command: installer.command, args: [installer.installArg, ...packages] };
}

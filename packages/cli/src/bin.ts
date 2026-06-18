#!/usr/bin/env node
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import spawn from "cross-spawn";
import { assessMany, assessTree } from "@phantomdep/core";
import {
  buildDelegateCommand,
  detectInstaller,
  finalize,
  formatVersion,
  installerForEcosystem,
  parseInstallArgs,
  planInstall,
  scanExitCode,
} from "./logic.js";
import { report } from "./reporter.js";

function readVersion(): string {
  const pkgPath = fileURLToPath(new URL("../package.json", import.meta.url));
  const pkg = JSON.parse(readFileSync(pkgPath, "utf8")) as { version: string };
  return pkg.version;
}

function log(msg = ""): void {
  process.stdout.write(`${msg}\n`);
}

async function runInstall(args: string[]): Promise<number> {
  let parsed;
  try {
    parsed = parseInstallArgs(args);
  } catch (err) {
    log(err instanceof Error ? err.message : String(err));
    return 64;
  }

  const { packages, force } = parsed;
  if (packages.length === 0) {
    log("phantomdep install <packages...> [--ecosystem npm|pypi] [--force]");
    return 64;
  }

  // Explicit --ecosystem wins; otherwise auto-detect from project files.
  const installer = parsed.ecosystem
    ? installerForEcosystem(parsed.ecosystem)
    : detectInstaller(readdirSync(process.cwd()));
  if (!installer) {
    log("Could not detect npm or pip project. Pass --ecosystem npm|pypi.");
    return 64;
  }

  log(`PhantomDep: checking ${packages.length} package(s) on ${installer.ecosystem}...`);
  const assessments = await assessMany(packages, installer.ecosystem);
  log(report(assessments));

  const plan = planInstall(assessments, force);
  if (plan.action === "block") {
    if (plan.phantoms.length > 0) {
      log(`\nBlocked: ${plan.phantoms.map((p) => p.name).join(", ")} not found on registry. Install aborted.`);
    } else {
      log(`\nSuspicious packages found. Re-run with --force to install anyway.`);
    }
    return plan.exitCode;
  }

  if (plan.suspicious.length > 0) {
    log(`\nProceeding despite warnings (--force).`);
  }

  const { command, args: delegateArgs } = buildDelegateCommand(installer, packages);
  log(`\nDelegating to: ${[command, ...delegateArgs].join(" ")}`);
  return await delegate(command, delegateArgs);
}

function delegate(command: string, args: string[]): Promise<number> {
  return new Promise((resolveExit) => {
    // cross-spawn resolves npm/pip (and their .cmd shims on Windows) correctly
    // with shell:false, so args are passed as a real array — never concatenated.
    const child = spawn(command, args, { stdio: "inherit" });
    child.on("close", (code) => resolveExit(code ?? 0));
    child.on("error", () => resolveExit(1));
  });
}

function findLockfile(target?: string): string | null {
  if (target) {
    const p = resolve(target);
    if (existsSync(p)) return p;
  }
  for (const candidate of ["package-lock.json", "npm-shrinkwrap.json", "requirements.txt"]) {
    const p = resolve(process.cwd(), candidate);
    if (existsSync(p)) return p;
  }
  return null;
}

async function runScan(args: string[]): Promise<number> {
  const lockfile = findLockfile(args.find((a) => !a.startsWith("-")));
  if (!lockfile) {
    log("No lockfile found (package-lock.json or requirements.txt).");
    return 64;
  }
  log(`PhantomDep: scanning ${lockfile}...`);
  const assessments = await assessTree(lockfile);
  log(report(assessments));
  const code = scanExitCode(assessments);
  log(`\n${assessments.length} package(s) scanned. ${code === 0 ? "Clean." : code === 1 ? "Phantom dependencies found." : "Suspicious dependencies found."}`);
  return code;
}

async function main(): Promise<number> {
  const [command, ...rest] = process.argv.slice(2);
  switch (command) {
    case "--version":
    case "-v":
      log(formatVersion(readVersion()));
      return 0;
    case "install":
      return runInstall(rest);
    case "scan":
      return runScan(rest);
    default:
      log("PhantomDep — slopsquatting guard\n\nUsage:\n  phantomdep install <packages...> [--force]\n  phantomdep scan [lockfile]");
      return command ? 64 : 0;
  }
}

main()
  .then(finalize)
  .catch((err: unknown) => {
    process.stderr.write(`phantomdep error: ${String(err)}\n`);
    finalize(1);
  });

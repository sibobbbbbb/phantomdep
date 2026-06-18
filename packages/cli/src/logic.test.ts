import { describe, expect, test } from "vitest";
import type { Assessment } from "@phantomdep/core";
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

const a = (name: string, verdict: Assessment["verdict"]): Assessment => ({
  name,
  ecosystem: "npm",
  verdict,
  reasons: [verdict],
});

describe("scanExitCode", () => {
  test("0 when all ok", () => {
    expect(scanExitCode([a("react", "ok")])).toBe(0);
  });
  test("2 when only suspicious present", () => {
    expect(scanExitCode([a("react", "ok"), a("x", "suspicious")])).toBe(2);
  });
  test("1 when any phantom present (phantom wins over suspicious)", () => {
    expect(scanExitCode([a("x", "suspicious"), a("y", "phantom")])).toBe(1);
  });
});

describe("planInstall", () => {
  test("blocks on phantom even with --force", () => {
    const plan = planInstall([a("ghost", "phantom")], true);
    expect(plan.action).toBe("block");
    expect(plan.exitCode).toBe(1);
    expect(plan.phantoms.map((p) => p.name)).toEqual(["ghost"]);
  });

  test("blocks on suspicious without --force (exit 2)", () => {
    const plan = planInstall([a("risky", "suspicious")], false);
    expect(plan.action).toBe("block");
    expect(plan.exitCode).toBe(2);
  });

  test("proceeds on suspicious with --force", () => {
    const plan = planInstall([a("risky", "suspicious")], true);
    expect(plan.action).toBe("proceed");
    expect(plan.exitCode).toBe(0);
  });

  test("proceeds when all ok", () => {
    expect(planInstall([a("react", "ok")], false).action).toBe("proceed");
  });
});

describe("formatVersion", () => {
  test("prefixes the version with the package name", () => {
    expect(formatVersion("0.1.0")).toBe("phantomdep v0.1.0");
  });
});

describe("parseInstallArgs", () => {
  test("consumes --ecosystem value; it never leaks into packages (flag after positional)", () => {
    const r = parseInstallArgs(["foo", "--ecosystem", "pypi"]);
    expect(r.packages).toEqual(["foo"]);
    expect(r.ecosystem).toBe("pypi");
    expect(r.force).toBe(false);
  });

  test("consumes --ecosystem value regardless of order (flag before positional)", () => {
    const r = parseInstallArgs(["--ecosystem", "pypi", "foo"]);
    expect(r.packages).toEqual(["foo"]);
    expect(r.ecosystem).toBe("pypi");
  });

  test("flag-before and flag-after produce identical parse", () => {
    expect(parseInstallArgs(["express", "--ecosystem", "npm"])).toEqual(
      parseInstallArgs(["--ecosystem", "npm", "express"]),
    );
  });

  test("supports --ecosystem=value form", () => {
    const r = parseInstallArgs(["foo", "--ecosystem=pypi"]);
    expect(r.packages).toEqual(["foo"]);
    expect(r.ecosystem).toBe("pypi");
  });

  test("ecosystem is undefined when not passed", () => {
    expect(parseInstallArgs(["foo"]).ecosystem).toBeUndefined();
  });

  test("parses --force without treating it as a package", () => {
    const r = parseInstallArgs(["foo", "--force"]);
    expect(r.packages).toEqual(["foo"]);
    expect(r.force).toBe(true);
  });

  test("rejects an invalid ecosystem value", () => {
    expect(() => parseInstallArgs(["foo", "--ecosystem", "cargo"])).toThrow(/ecosystem/i);
  });

  test("rejects a missing ecosystem value", () => {
    expect(() => parseInstallArgs(["foo", "--ecosystem"])).toThrow(/ecosystem/i);
  });
});

describe("installerForEcosystem", () => {
  test("npm ecosystem maps to npm install", () => {
    expect(installerForEcosystem("npm")).toEqual({
      ecosystem: "npm",
      command: "npm",
      installArg: "install",
    });
  });

  test("pypi ecosystem maps to pip install", () => {
    expect(installerForEcosystem("pypi")).toEqual({
      ecosystem: "pypi",
      command: "pip",
      installArg: "install",
    });
  });
});

describe("buildDelegateCommand", () => {
  test("builds command + args array from one source (no shell concatenation)", () => {
    const installer = installerForEcosystem("npm");
    expect(buildDelegateCommand(installer, ["express"])).toEqual({
      command: "npm",
      args: ["install", "express"],
    });
  });

  test("passes multiple packages as separate args, never a joined string", () => {
    const installer = installerForEcosystem("npm");
    const { args } = buildDelegateCommand(installer, ["express", "lodash"]);
    expect(args).toEqual(["install", "express", "lodash"]);
  });
});

describe("finalize", () => {
  // Regression: the CLI must communicate its exit code via process.exitCode and
  // let the event loop drain — NOT call process.exit(). On Windows, forcing exit
  // while undici's fetch keep-alive handles are still closing trips a libuv
  // assertion (!(handle->flags & UV_HANDLE_CLOSING)) and the process dies with
  // exit 127 instead of the intended code. If finalize ever reverts to
  // process.exit(), this test crashes the vitest worker and the suite fails.
  test("sets process.exitCode and never forces process.exit", () => {
    const original = process.exitCode;
    try {
      finalize(2);
      expect(process.exitCode).toBe(2);
    } finally {
      process.exitCode = original;
    }
  });
});

describe("detectInstaller", () => {
  test("npm from package.json", () => {
    const i = detectInstaller(["package.json", "README.md"]);
    expect(i?.ecosystem).toBe("npm");
    expect(i?.command).toBe("npm");
  });
  test("pip from requirements.txt", () => {
    const i = detectInstaller(["requirements.txt"]);
    expect(i?.ecosystem).toBe("pypi");
    expect(i?.command).toBe("pip");
  });
  test("null when nothing recognized", () => {
    expect(detectInstaller(["foo.txt"])).toBeNull();
  });
});

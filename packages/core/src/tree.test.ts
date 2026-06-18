import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, test } from "vitest";
import { extractPackages, resolveLockfile } from "./tree.js";

describe("extractPackages - npm package-lock v3 (packages map)", () => {
  test("extracts nested and scoped deps, stripped of node_modules path", () => {
    const lock = JSON.stringify({
      packages: {
        "": { name: "root" },
        "node_modules/react": { version: "18.0.0" },
        "node_modules/@babel/core": { version: "7.0.0" },
        "node_modules/react/node_modules/loose-envify": { version: "1.0.0" },
      },
    });
    const { ecosystem, names } = extractPackages("package-lock.json", lock);
    expect(ecosystem).toBe("npm");
    expect(names.sort()).toEqual(["@babel/core", "loose-envify", "react"]);
  });
});

describe("extractPackages - npm package-lock v1 (dependencies tree)", () => {
  test("walks nested dependencies", () => {
    const lock = JSON.stringify({
      dependencies: {
        react: { version: "18", dependencies: { "loose-envify": { version: "1" } } },
        lodash: { version: "4" },
      },
    });
    const { names } = extractPackages("package-lock.json", lock);
    expect(names.sort()).toEqual(["lodash", "loose-envify", "react"]);
  });
});

describe("extractPackages - requirements.txt", () => {
  test("parses names, ignoring versions, comments and options", () => {
    const txt = [
      "requests==2.31.0",
      "flask>=1.0",
      "# a comment",
      "",
      "-e .",
      "numpy",
      "Django>=4 ; python_version>='3.8'",
    ].join("\n");
    const { ecosystem, names } = extractPackages("requirements.txt", txt);
    expect(ecosystem).toBe("pypi");
    expect(names.sort()).toEqual(["Django", "flask", "numpy", "requests"]);
  });
});

describe("extractPackages - dedupe", () => {
  test("returns each name once", () => {
    const lock = JSON.stringify({
      packages: {
        "node_modules/react": {},
        "node_modules/x/node_modules/react": {},
      },
    });
    expect(extractPackages("package-lock.json", lock).names).toEqual(["react"]);
  });
});

describe("resolveLockfile", () => {
  async function withTempDir(fn: (dir: string) => Promise<void>): Promise<void> {
    const dir = await mkdtemp(join(tmpdir(), "phantomdep-"));
    try {
      await fn(dir);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  test("returns a file path unchanged", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "package-lock.json");
      await writeFile(file, "{}");
      expect(await resolveLockfile(file)).toBe(file);
    });
  });

  test("resolves a directory to its package-lock.json", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "package-lock.json");
      await writeFile(file, "{}");
      expect(await resolveLockfile(dir)).toBe(file);
    });
  });

  test("resolves a directory to requirements.txt when no npm lock present", async () => {
    await withTempDir(async (dir) => {
      const file = join(dir, "requirements.txt");
      await writeFile(file, "requests\n");
      expect(await resolveLockfile(dir)).toBe(file);
    });
  });

  test("throws a descriptive error (not raw EISDIR) for a directory with no lockfile", async () => {
    await withTempDir(async (dir) => {
      await expect(resolveLockfile(dir)).rejects.toThrow(/no lockfile/i);
    });
  });
});

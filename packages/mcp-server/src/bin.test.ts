import { spawn, spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { beforeAll, describe, expect, test } from "vitest";

const binPath = fileURLToPath(new URL("../dist/bin.js", import.meta.url));
const indexPath = fileURLToPath(new URL("../dist/index.js", import.meta.url));
const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const tsconfigPath = fileURLToPath(new URL("../tsconfig.json", import.meta.url));

// Build the server (and its referenced deps) so the integration tests run
// against the current source, not a stale dist. We invoke the local `tsc`
// binary through process.execPath rather than spawning `pnpm`: on Windows,
// spawnSync of a `.cmd` shim fails with EINVAL unless a shell is used, and
// `shell: true` triggers the DEP0190 deprecation warning. Running tsc directly
// is cross-platform, shell-free, and warning-free. `tsc --build` walks the
// project references (mcp-server -> core -> blocklist) and rebuilds in order.
beforeAll(() => {
  const require = createRequire(import.meta.url);
  const tsc = require.resolve("typescript/bin/tsc");
  const result = spawnSync(process.execPath, [tsc, "--build", tsconfigPath], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(
      `failed to build @phantomdep/mcp-server for the integration test ` +
        `(status=${String(result.status)}, error=${result.error ? String(result.error) : "none"})`,
    );
  }
}, 180_000);

describe("phantomdep-mcp built binary (stdio)", () => {
  test("prints a startup line to stderr so it's visible the server is listening", async () => {
    const child = spawn(process.execPath, [binPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    // Give it a moment to start, then shut it down via stdin EOF.
    await new Promise((r) => setTimeout(r, 750));
    child.stdin.end();
    await new Promise((r) => child.on("close", r));

    expect(stderr).toMatch(/ready/i);
  });

  test("stays alive, completes the initialize handshake, and exposes check_packages", async () => {
    const transport = new StdioClientTransport({
      command: process.execPath,
      args: [binPath],
    });
    const client = new Client({ name: "integration-test", version: "0" });
    await client.connect(transport);

    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name)).toEqual(["check_packages"]);

    await client.close();
  });

  // Regression for Bug 4: the original "no output" failure was caused by piping
  // JSON-RPC into dist/index.js (the library barrel) instead of dist/bin.js.
  // Running the barrel directly must now fail loudly, not silently no-op.
  test("running the library barrel (index.js) directly exits non-zero and points at bin.js", async () => {
    const child = spawn(process.execPath, [indexPath], { stdio: ["ignore", "pipe", "pipe"] });
    let stderr = "";
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });
    const code = await new Promise<number>((r) => child.on("close", (c) => r(c ?? 0)));

    expect(code).not.toBe(0);
    expect(stderr).toMatch(/bin\.js/);
  });

  // Regression for Bug 4: exercise REAL OS-level stdio exactly like the manual
  // repro — write two newline-delimited JSON-RPC messages to the binary's stdin,
  // end stdin (EOF), and assert both responses come back on stdout. Uses
  // tools/list (not check_packages) to stay network-free and deterministic.
  test("raw piped stdin: two newline-delimited requests yield two stdout responses, then clean EOF exit", async () => {
    const child = spawn(process.execPath, [binPath], { stdio: ["pipe", "pipe", "pipe"] });
    let stdout = "";
    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    const initialize = JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "raw-pipe-test", version: "1.0" },
      },
    });
    const listTools = JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
    child.stdin.write(`${initialize}\n${listTools}\n`);
    child.stdin.end(); // EOF — server must finish in-flight responses before closing.

    const code = await new Promise<number>((r) => child.on("close", (c) => r(c ?? 0)));

    const responses = stdout
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as { id: number; result?: unknown });
    expect(responses.map((m) => m.id)).toEqual([1, 2]);
    expect(responses[0]?.result).toBeDefined();
    expect(responses[1]?.result).toBeDefined();
    expect(code).toBe(0);
  });
});

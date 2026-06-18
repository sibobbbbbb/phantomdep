import { realpathSync } from "node:fs";
import { argv, exit, stderr } from "node:process";
import { fileURLToPath } from "node:url";

export { createServer } from "./server.js";
export { summarize, type PackageVerdict } from "./summarize.js";

// This module is the library barrel (package `main`), NOT the stdio entrypoint.
// Running `node dist/index.js` directly starts no server, reads no stdin, and
// writes nothing — a silent no-op that looks identical to a crashed server.
// If executed directly, fail loudly and point at the real binary. When imported
// (the normal case), argv[1] is the consumer's entry, so this guard stays inert.
function isExecutedDirectly(): boolean {
  if (!argv[1]) return false;
  try {
    return realpathSync(fileURLToPath(import.meta.url)) === realpathSync(argv[1]);
  } catch {
    return false;
  }
}

if (isExecutedDirectly()) {
  stderr.write(
    "@phantomdep/mcp-server: this is the library entry, not the MCP server.\n" +
      "Run the stdio binary instead:  node dist/bin.js\n",
  );
  exit(1);
}

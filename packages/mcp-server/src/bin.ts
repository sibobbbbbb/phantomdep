#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./server.js";

async function main(): Promise<void> {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  // Startup signal on stderr only — stdout is the JSON-RPC channel and must stay clean.
  process.stderr.write("PhantomDep MCP server ready (stdio)\n");
}

main().catch((err: unknown) => {
  process.stderr.write(`phantomdep-mcp failed to start: ${String(err)}\n`);
  process.exit(1);
});

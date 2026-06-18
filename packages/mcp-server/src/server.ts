import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { assessMany } from "@phantomdep/core";
import { z } from "zod";
import { summarize } from "./summarize.js";

const inputShape = {
  names: z.array(z.string().min(1)).min(1).describe("Package names to verify"),
  ecosystem: z.enum(["npm", "pypi"]).describe("Registry to check against"),
};

/** Build the PhantomDep MCP server exposing the single `check_packages` tool. */
export function createServer(): McpServer {
  const server = new McpServer({
    name: "phantomdep",
    version: "0.1.0",
  });

  server.registerTool(
    "check_packages",
    {
      title: "Check packages for slopsquatting",
      description:
        "Verify package names before installing. Returns a tiny verdict per name: " +
        "'phantom' (does not exist — do NOT install), 'suspicious' (exists but risky), or 'ok'.",
      inputSchema: inputShape,
    },
    async ({ names, ecosystem }) => {
      const verdicts = summarize(await assessMany(names, ecosystem));
      return {
        content: [{ type: "text", text: JSON.stringify(verdicts) }],
      };
    },
  );

  return server;
}

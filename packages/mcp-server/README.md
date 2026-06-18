# @phantomdep/mcp-server

The **flagship** PhantomDep surface: a local [MCP](https://modelcontextprotocol.io)
server that lets an AI coding agent verify package names **before** it installs them.

It exposes exactly one tool, `check_packages`, and returns a deliberately tiny
verdict per package so it never bloats the agent's context window.

## Tool

```
check_packages(input: { names: string[]; ecosystem: "npm" | "pypi" })
  -> Array<{ name: string; verdict: "ok" | "suspicious" | "phantom"; reason: string }>
```

- `phantom` — the package does not exist on the registry. **Do not install.**
- `suspicious` — it exists but is risky (blocklisted, brand-new + low adoption, or an
  AI-style name resembling a popular package). Proceed with care.
- `ok` — verified on the registry.

## Setup

Build first (from the repo root): `pnpm install && pnpm build`. The stdio binary
lands at `packages/mcp-server/dist/bin.js`.

### Claude Code

Add to `.mcp.json` (project) or `~/.claude.json` (global):

```json
{
  "mcpServers": {
    "phantomdep": {
      "command": "node",
      "args": ["packages/mcp-server/dist/bin.js"]
    }
  }
}
```

Or, once published to npm:

```json
{
  "mcpServers": {
    "phantomdep": {
      "command": "npx",
      "args": ["-y", "@phantomdep/mcp-server"]
    }
  }
}
```

### Cursor

Add to `~/.cursor/mcp.json` (global) or `.cursor/mcp.json` (project):

```json
{
  "mcpServers": {
    "phantomdep": {
      "command": "npx",
      "args": ["-y", "@phantomdep/mcp-server"]
    }
  }
}
```

## Privacy

Fully local. The only network calls are anonymous lookups of package **names** to
the public npm / PyPI registries. No account, no telemetry, no backend.

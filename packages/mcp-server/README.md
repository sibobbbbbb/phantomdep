<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# 👻 @phantomdep/mcp-server

**The flagship PhantomDep surface** — an MCP server so your AI agent verifies packages before installing.

[![npm version](https://img.shields.io/npm/v/@phantomdep/mcp-server?color=cb3837&logo=npm)](https://www.npmjs.com/package/@phantomdep/mcp-server)
[![npm downloads](https://img.shields.io/npm/dm/@phantomdep/mcp-server?color=cb3837)](https://www.npmjs.com/package/@phantomdep/mcp-server)
[![CI](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml/badge.svg)](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml)
[![MCP](https://img.shields.io/badge/MCP-stdio-7c3aed)](https://modelcontextprotocol.io)
[![license](https://img.shields.io/npm/l/@phantomdep/mcp-server?color=blue)](LICENSE)

</div>

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

The recommended way is via `npx` — no install step, always the latest version.

### Claude Code

Add to `.mcp.json` (project) or `~/.claude.json` (global):

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

### From a local build

When working in the repo, point at the built stdio binary instead. Run
`pnpm install && pnpm build` first, then:

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

## Privacy

Fully local. The only network calls are anonymous lookups of package **names** to
the public npm / PyPI registries. No account, no telemetry, no backend.

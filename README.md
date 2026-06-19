<!-- markdownlint-disable MD033 MD041 MD001 MD026 -->
<div align="center">

# 👻 PhantomDep

### Catch AI-hallucinated dependencies *before* they're installed.

A privacy-first, **zero-infra** slopsquatting guard for the agentic era — it verifies
package names at the **agent (MCP)** and **install (CLI)** boundaries, fully on your machine.

[![CI](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml/badge.svg)](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml)
[![npm · cli](https://img.shields.io/npm/v/@phantomdep/cli?label=%40phantomdep%2Fcli&color=cb3837&logo=npm)](https://www.npmjs.com/package/@phantomdep/cli)
[![npm · mcp-server](https://img.shields.io/npm/v/@phantomdep/mcp-server?label=%40phantomdep%2Fmcp-server&color=cb3837&logo=npm)](https://www.npmjs.com/package/@phantomdep/mcp-server)
[![license](https://img.shields.io/npm/l/@phantomdep/cli?color=blue)](LICENSE)
[![MCP](https://img.shields.io/badge/MCP-stdio-7c3aed)](packages/mcp-server)

</div>

---

## The problem: slopsquatting

LLMs confidently invent plausible-but-**nonexistent** package names — `flask-gpt-helper`,
`react-ai-utils`, `easy-requests`. Attackers pre-register those exact names with malware.
Then a developer (or an autonomous agent) installs one.

And here's the trap: **the install *is* the attack.** `npm install` / `pip install` run
lifecycle hooks *during* installation — "scan after install" is already too late.

> PhantomDep checks names **before** the real package manager ever runs.

No backend. No database. No account. No telemetry. The only network calls are anonymous
lookups of a package **name** to the public npm / PyPI registries.

---

## ✨ Why PhantomDep

- 🛡️ **Blocks the attack at the right moment** — verification happens *before* delegation to npm/pip, not after.
- 🤖 **Built for AI agents** — a flagship MCP server gives your coding agent a verdict before it decides to install.
- 🌳 **Sees the whole tree** — scans full lockfiles, catching nested/transitive hallucinations that never appear in `package.json`.
- 🪶 **Context-frugal** — the MCP tool returns tiny verdicts, never verbose threat dumps that blow up your agent's context window.
- 🔒 **Fully local & free** — zero infrastructure, nothing to deploy, nothing phoned home.
- 🎯 **Low false positives** — phantom packages are blocked; merely *suspicious* ones only warn, so legitimate niche packages keep working.

---

## 🚀 Quick start

### MCP server — for AI coding agents *(flagship)*

Point your agent at PhantomDep so it verifies packages before installing. Add to your MCP
config (Claude Code `.mcp.json`, or Cursor `~/.cursor/mcp.json`):

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

The agent now has one tool — `check_packages` — returning `ok` / `suspicious` / `phantom`
per name. See [packages/mcp-server](packages/mcp-server) for details.

### CLI — for humans, pre-commit hooks & CI

```bash
npm install -g @phantomdep/cli
```

```bash
# Guard an install: blocks phantoms, warns on suspicious, then delegates to npm/pip.
phantomdep install express
phantomdep install some-pkg --ecosystem pypi
phantomdep install risky-pkg --force      # override warnings — never unblocks a phantom

# Scan a lockfile's full dependency tree (catches nested/transitive deps).
phantomdep scan                            # auto-detects package-lock.json / requirements.txt
phantomdep scan path/to/lockfile
```

**Exit codes:** `0` clean · `1` phantom found (blocked) · `2` suspicious only — wire these
straight into CI.

---

## 🧭 How verdicts work

| Verdict | Meaning | Action |
| --- | --- | --- |
| 🔴 **`phantom`** | Not found on the registry. The strongest signal. | **Blocked** |
| 🟡 **`suspicious`** | Exists, but risky: blocklisted, brand-new + very low adoption, or an AI-style name closely resembling a popular package. | **Warned** (never blocked) |
| 🟢 **`ok`** | Verified on the registry. | Allowed |

The engine combines several signals: **registry existence** (a miss short-circuits to
`phantom`), **package age**, **adoption / download counts**, **LLM naming patterns**
(`-helper`, `gpt-`, `-sdk`…), **typosquat similarity** to popular packages
(`reqeusts` → `requests`), and an exact-match **community blocklist**.

---

## 📦 Packages

| Package | Version | What it is |
| --- | --- | --- |
| [`@phantomdep/core`](packages/core) | [![npm](https://img.shields.io/npm/v/@phantomdep/core?color=cb3837&label=)](https://www.npmjs.com/package/@phantomdep/core) | Detection engine — existence, age/adoption, AI-naming heuristics, typosquat similarity, blocklist. Framework-agnostic. |
| [`@phantomdep/mcp-server`](packages/mcp-server) | [![npm](https://img.shields.io/npm/v/@phantomdep/mcp-server?color=cb3837&label=)](https://www.npmjs.com/package/@phantomdep/mcp-server) | **Flagship.** MCP server (stdio) exposing one context-frugal `check_packages` tool. |
| [`@phantomdep/cli`](packages/cli) | [![npm](https://img.shields.io/npm/v/@phantomdep/cli?color=cb3837&label=)](https://www.npmjs.com/package/@phantomdep/cli) | Install-guard (`install`) + full-tree lockfile scanner (`scan`). |
| [`@phantomdep/blocklist`](packages/blocklist) | [![npm](https://img.shields.io/npm/v/@phantomdep/blocklist?color=cb3837&label=)](https://www.npmjs.com/package/@phantomdep/blocklist) | Curated hallucinated-name data + scheduled auto-update. |

All detection logic lives in `core`; every other package is a thin adapter over it.

---

## 🛠️ Development

```bash
pnpm install      # install workspace deps
pnpm build        # build all packages
pnpm test         # vitest unit tests
pnpm typecheck    # tsc --build across the workspace
pnpm lint         # eslint
```

This is a pnpm monorepo. Detection is pure, unit-tested TypeScript with no real network
calls in tests (ecosystem adapters are mocked).

---

## 📄 License

[MIT](LICENSE) © Farhan Raditya Aji

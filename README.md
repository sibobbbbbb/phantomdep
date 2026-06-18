# PhantomDep

> A privacy-first, zero-infra slopsquatting guard for the agentic era — verifies
> dependencies at the agent (MCP) and install (CLI) boundaries, fully on your machine.

**Slopsquatting** is when LLMs hallucinate plausible-but-nonexistent package names
(e.g. `flask-gpt-helper`), attackers pre-register those names with malware, and
developers or agents install them. The install *is* the attack — postinstall hooks run
during `npm install` / `pip install`. PhantomDep checks names **before** the real
package manager runs.

Zero infrastructure: only public registry APIs (npm, PyPI), local heuristics, and a
bundled community blocklist. No backend, no database, no account, no telemetry.

## Packages

| Package | What it is |
| --- | --- |
| [`@phantomdep/core`](packages/core) | Detection engine — registry existence, age/adoption, AI-naming heuristics, typosquat similarity, blocklist. Framework-agnostic. |
| [`@phantomdep/mcp-server`](packages/mcp-server) | **Flagship.** MCP server (stdio) exposing one context-frugal `check_packages` tool for AI agents. |
| [`@phantomdep/cli`](packages/cli) | Install-guard (`install`) + full-tree lockfile scanner (`scan`). |
| [`@phantomdep/blocklist`](packages/blocklist) | Curated hallucinated-name data + scheduled auto-update. |

## How verdicts work

- **`phantom`** — not found on the registry. Strongest signal; **blocked** by the CLI.
- **`suspicious`** — exists but risky (blocklisted, brand-new + very low adoption, or an
  AI-style name closely resembling a popular package). **Warned**, never blocked.
- **`ok`** — verified.

Phantom blocks, suspicious warns — so legitimate niche packages don't break.

## Quick start

```bash
pnpm install      # install workspace deps
pnpm build        # build all packages
pnpm test         # vitest unit tests
pnpm typecheck    # tsc --build across the workspace
```

### CLI

```bash
# Guard an install: blocks phantoms, warns on suspicious, then delegates to npm/pip.
node packages/cli/dist/bin.js install <packages...> [--force]

# Scan a lockfile's full dependency tree (catches nested/transitive deps).
node packages/cli/dist/bin.js scan [lockfile]
```

Exit codes: `0` clean · `1` phantom found (blocked) · `2` suspicious only.
`--force` overrides suspicious warnings but **never** unblocks a phantom.

### MCP server (flagship)

See [packages/mcp-server/README.md](packages/mcp-server/README.md) for Claude Code and
Cursor configuration snippets.

## License

MIT

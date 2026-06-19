<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# 👻 @phantomdep/core

**The detection engine behind PhantomDep** — slopsquatting verdicts for package names.

[![npm version](https://img.shields.io/npm/v/@phantomdep/core?color=cb3837&logo=npm)](https://www.npmjs.com/package/@phantomdep/core)
[![npm downloads](https://img.shields.io/npm/dm/@phantomdep/core?color=cb3837)](https://www.npmjs.com/package/@phantomdep/core)
[![CI](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml/badge.svg)](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@phantomdep/core?color=blue)](LICENSE)

</div>

The detection engine behind [PhantomDep](https://github.com/sibobbbbbb/phantomdep) — a
privacy-first, zero-infra guard against **slopsquatting** (AI-hallucinated dependency)
attacks. It verifies package names against the public npm / PyPI registries plus local
heuristics, and returns a small, structured verdict per package.

Surface-agnostic and dependency-light: the MCP server and CLI are thin adapters over this
package.

## Install

```sh
npm install @phantomdep/core
```

## Usage

```ts
import { assess, assessMany, assessTree } from "@phantomdep/core";

await assess("express", "npm");
// { name: "express", ecosystem: "npm", verdict: "ok", reasons: ["verified on npm"] }

await assess("flask-gpt-helper", "pypi");
// { ..., verdict: "phantom", reasons: ["not found on PyPI"] }

await assessMany(["express", "reqeusts"], "npm"); // batched
await assessTree("package-lock.json");            // full dependency tree, incl. nested deps
```

## Verdicts

- `phantom` — does not exist on the registry. **Block it.**
- `suspicious` — exists but risky (blocklisted, brand-new + low adoption, or an AI-style
  name close to a popular package). Warn only.
- `ok` — verified on the registry.

## Privacy

Fully local. The only network calls are anonymous lookups of package **names** to the
public npm / PyPI registries. No account, no telemetry, no backend.

## License

MIT © Farhan Raditya Aji

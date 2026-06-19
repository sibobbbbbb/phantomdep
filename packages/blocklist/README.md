<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# 👻 @phantomdep/blocklist

**Curated hallucinated-package-name data** for PhantomDep — bundled, no runtime network.

[![npm version](https://img.shields.io/npm/v/@phantomdep/blocklist?color=cb3837&logo=npm)](https://www.npmjs.com/package/@phantomdep/blocklist)
[![npm downloads](https://img.shields.io/npm/dm/@phantomdep/blocklist?color=cb3837)](https://www.npmjs.com/package/@phantomdep/blocklist)
[![CI](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml/badge.svg)](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@phantomdep/blocklist?color=blue)](LICENSE)

</div>

The curated blocklist of known hallucinated package names used by
[PhantomDep](https://github.com/sibobbbbbb/phantomdep), a privacy-first, zero-infra guard
against slopsquatting (AI-hallucinated dependency) attacks.

The data is **bundled** (no live network dependency at runtime) and consumed by
`@phantomdep/core`. A scheduled GitHub Action refreshes it from public research datasets and
community reports.

## Install

```sh
npm install @phantomdep/blocklist
```

## Usage

```ts
import { isBlocklisted, loadBlocklist } from "@phantomdep/blocklist";

isBlocklisted("flask-gpt-helper", "pypi"); // boolean
loadBlocklist("npm");                       // Set<string> of blocklisted names
```

## Data shape

`data/<ecosystem>.json`:

```json
{
  "ecosystem": "npm",
  "updated": "2026-06-16",
  "entries": [{ "name": "example-hallucinated-pkg", "source": "research-dataset", "note": "optional" }]
}
```

## License

MIT © Farhan Raditya Aji

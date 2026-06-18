# @phantomdep/blocklist

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

<!-- markdownlint-disable MD033 MD041 -->
<div align="center">

# 👻 @phantomdep/cli

**Install-guard + lockfile scanner** — catch AI-hallucinated dependencies before they install.

[![npm version](https://img.shields.io/npm/v/@phantomdep/cli?color=cb3837&logo=npm)](https://www.npmjs.com/package/@phantomdep/cli)
[![npm downloads](https://img.shields.io/npm/dm/@phantomdep/cli?color=cb3837)](https://www.npmjs.com/package/@phantomdep/cli)
[![CI](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml/badge.svg)](https://github.com/sibobbbbbb/phantomdep/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/@phantomdep/cli?color=blue)](LICENSE)

</div>

The PhantomDep install-guard and lockfile scanner — verify dependency names **before** they
are installed, at the execution boundary. Part of
[PhantomDep](https://github.com/sibobbbbbb/phantomdep), a privacy-first, zero-infra guard
against slopsquatting (AI-hallucinated dependency) attacks.

## Install

```sh
npm install -g @phantomdep/cli
```

## Usage

```sh
# Guard an install: blocks phantom packages, warns on suspicious, then delegates
# to the real package manager (npm / pip, auto-detected from project files).
phantomdep install express
phantomdep install some-pkg --ecosystem pypi
phantomdep install risky-pkg --force      # override warnings; never unblocks phantom

# Scan a lockfile's full dependency tree (nested deps included). For pre-commit / CI.
phantomdep scan                # auto-detects package-lock.json / requirements.txt
phantomdep scan path/to/lockfile
```

The check always runs **before** the real install command — because with lifecycle hooks,
`npm install` / `pip install` *is* the attack.

## Exit codes

- `0` — clean
- `1` — phantom dependency found (blocked)
- `2` — suspicious dependency found (warning only)

## Privacy

Fully local. The only network calls are anonymous lookups of package **names** to the
public npm / PyPI registries. No account, no telemetry, no backend.

## License

MIT © Farhan Raditya Aji

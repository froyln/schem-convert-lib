# AGENTS.md

Context file for AI agents working in this repo.

## What this is

A library that converts `.litematic` schematic files between Minecraft versions (1.12.2, and
1.13.2 through 1.21.8), rewriting the block palette so blocks the target version doesn't have
get substituted instead of silently disappearing. Node.js, prismarine-nbt. No UI, no bot — see
[Schem-Converter](https://github.com/CodeW4VE/Schem-Converter) for the Discord bot that consumes
this as a dependency.

Read [docs/architecture.md](docs/architecture.md) first — it has the full file-by-file
structure, how a conversion actually runs, and the codebase's conventions. Treat it as the
source of truth over assumptions.

## Working conventions for AI agents

- Read [CLAUDE.md](CLAUDE.md) — it points here and to `PLAN.md`.
- Before editing `lib/palette.js`'s substitution tiers or `lib/flattening.js`'s alias tables,
  run the sweep that found the current gaps: for every block in a `data/blocks-*.json`, run it
  through `fixProperties` at its default state then `flattenState`/`findSubstitute`, and check
  what falls through to the `command_block` marker. It catches silent regressions fast.
- Don't add dependencies for what prismarine-nbt/node stdlib already cover.
- No unneeded comments. Only comment non-obvious WHY (hidden constraint, workaround, surprising
  behavior) — never restate WHAT code does. Costs tokens for no reader value.
- No `Co-Authored-By: Claude ...` or `Claude-Session: ...` trailers in commit messages.
- Keep [docs/architecture.md](docs/architecture.md) in sync when structure or conversion logic
  changes — it's the doc humans and agents both read, don't let this file duplicate it.

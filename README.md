# @froyln/schem-convert-lib

Converts Litematica `.litematic` schematic files between Minecraft versions, rewriting the
block and item palette so anything the target version doesn't have gets substituted instead of
silently disappearing.

## Install

```bash
npm install @froyln/schem-convert-lib
```

## Usage

```js
const fs = require('fs');
const { convertFile } = require('@froyln/schem-convert-lib');

const input = fs.readFileSync('build.litematic');
const { buffer, report } = await convertFile(input, '1.12.2');
fs.writeFileSync('build-1.12.2.litematic', buffer);

console.log(report.blockLines()); // e.g. ["minecraft:vault -> minecraft:command_block"]
```

See [docs/usage.md](docs/usage.md) for the full guide: detecting a source version, reading the
substitution report, error handling, and working with an already-parsed NBT tree.

- `inspectFile(buffer)` — gunzips and parses a `.litematic` buffer, returns `{ nbtVersion,
  dataVersion, label }` describing the source version without converting it.
- `convertFile(buffer, toMcVersion)` — converts a gzipped `.litematic` buffer to `toMcVersion`,
  returns `{ buffer, report }`. `buffer` is the converted, re-gzipped file. `report` exposes
  `blockLines()`, `itemLines()`, `noteLines()`, and `toLines()`.
- `convertSchematic(root, fromDataVersion, toMcVersion)` — the low-level entry point for callers
  that already hold a parsed NBT root (e.g. via `prismarine-nbt`). Mutates `root` in place and
  returns the same report.
- `SUPPORTED` — map of target Minecraft version string to its Litematica NBT version.
- `PRE_FLATTENING_MC_VERSION` — `'1.12.2'`, the one selectable target not in `SUPPORTED` (see
  Limitations below).

Both `inspectFile` and `convertFile` are async (`prismarine-nbt`'s parser is promise-based).

## Supported versions

1.12.2, and 1.13.2 through 26.1 (every version in `SUPPORTED`, plus 1.12.2 as a
downgrade-only target). Mojang dropped the "1." prefix in 2026: 26.1 is the year/drop successor
to the 1.21.x line, not a typo. 26.2 exists as a released Minecraft version but isn't supported
here yet — [minecraft-data](https://github.com/PrismarineJS/minecraft-data), the upstream
project this library's block/item data is generated from, hasn't published its data yet.

## Limitations

- **1.12.2 is downgrade-only.** 1.12.2 predates the Flattening (block ids became per-name
  states in 1.13); this library translates modern states down to 1.12.2's `id:meta` model, but
  does not un-flatten a 1.12.2 source back up. Uploading an actual 1.12.2 schematic and
  converting it to a newer version is unsupported for blocks, signs, and items alike.
- **Palette length never changes.** Litematica packs `BlockStates` indices at
  `ceil(log2(paletteSize))` bits; a substitution replaces a palette entry in place rather than
  adding or removing one.
- Known open bug: upgrading a `cauldron[level=2]` (partially filled) past its rename boundary
  loses the `level` property and silently becomes an empty cauldron, since `cauldron` exists in
  every target and the substitution resolver is never invoked for it. Vanilla's data-fixer
  produces `water_cauldron` here; this library does not yet.

## Development

```bash
npm test          # node --test test/*.test.js
npm run build-data  # regenerate data/blocks-<version>.json from minecraft-data
```

See [docs/architecture.md](docs/architecture.md) for the full conversion-logic writeup.

## License

[MIT](LICENSE) © froyln.

`data/vendor/block_state_map.json` is vendored unmodified from the
[Litematica](https://github.com/maruohon/litematica) mod and is licensed separately under
LGPL-3.0 — see `data/vendor/NOTICE.md` and `data/vendor/LICENSE.txt`. It is not covered by this
package's MIT license; it is included and used unmodified per LGPL's "used as a library" terms.

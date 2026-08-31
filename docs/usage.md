# Usage guide

Practical recipes for `@froyln/schem-convert-lib`. For how the conversion itself works
internally, see [architecture.md](architecture.md).

## Install

```bash
npm install @froyln/schem-convert-lib
```

## Convert a file on disk

The common case: read a `.litematic` file, convert it, write the result back out.

```js
const fs = require('fs');
const { convertFile } = require('@froyln/schem-convert-lib');

async function main() {
  const input = fs.readFileSync('build.litematic');
  const { buffer, report } = await convertFile(input, '1.12.2');

  fs.writeFileSync('build-1.12.2.litematic', buffer);
  console.log(`done, ${report.toLines().length} substitutions made`);
}

main();
```

`convertFile` is async (parsing is promise-based), so call it from inside an `async` function or
chain `.then()`.

## Detect the source version before converting

`inspectFile` gunzips and parses the buffer just enough to read its version tags, without
touching the palette. Useful for showing the user what they uploaded (this is how the
[Discord bot](https://github.com/CodeW4VE/Schem-Converter) built on this library labels the
source file in its dropdown prompt).

```js
const { inspectFile, SUPPORTED, PRE_FLATTENING_MC_VERSION } = require('@froyln/schem-convert-lib');

const info = await inspectFile(input);
console.log(info.label); // e.g. "1.21.4", or "1.13 - 1.16.5 (NBT 5)" if it can't pin an exact version

// every Minecraft version this library can convert TO
const targets = [...Object.keys(SUPPORTED), PRE_FLATTENING_MC_VERSION];
```

## Reading the substitution report

Every conversion returns a `report` alongside the converted buffer, describing what got
replaced because the target version doesn't have it. Substitutions are deduplicated — a report
lists each distinct `from -> to` pair once, no matter how many blocks/items it applied to.

```js
const { buffer, report } = await convertFile(input, '1.13.2');

report.blockLines(); // ["minecraft:vault -> minecraft:command_block", ...]
report.itemLines();  // ["minecraft:netherite_sword -> minecraft:diamond_sword", ...]
report.noteLines();  // free-text notes for lossy conversions that aren't a block/item swap,
                      // e.g. "sign back text dropped (target has no back side)"
report.toLines();    // all three lists concatenated, in that order
```

A block or item that resolves to nothing sensible in the target version is replaced with a
`minecraft:command_block`, labelled in the report with the original name, rather than vanishing
silently or crashing the conversion.

## Handling an unsupported target version

`toMcVersion` must be a key of `SUPPORTED`, or `PRE_FLATTENING_MC_VERSION` (`'1.12.2'`). Anything
else throws synchronously from inside the returned promise:

```js
try {
  await convertFile(input, '1.9.4'); // not a supported target
} catch (err) {
  console.error(err.message); // "Unsupported Minecraft version: 1.9.4"
}
```

## Working with an already-parsed NBT tree

If your code already parses the `.litematic` file itself (e.g. you need to inspect or mutate
other parts of the NBT tree before or after conversion), skip `convertFile` and call the
lower-level `convertSchematic` directly. It mutates the parsed root in place instead of
returning a new buffer.

```js
const nbt = require('prismarine-nbt');
const zlib = require('zlib');
const { convertSchematic } = require('@froyln/schem-convert-lib');

const data = await nbt.parse(zlib.gunzipSync(input));
const root = data.parsed.value;
const fromDataVersion = root.MinecraftDataVersion ? root.MinecraftDataVersion.value : 0;

const report = convertSchematic(root, fromDataVersion, '1.20.4');
// root is now mutated; re-serialize yourself:
const output = zlib.gzipSync(nbt.writeUncompressed(data.parsed));
```

This is exactly what `convertFile` does internally — see `index.js` if you want the full
gunzip/parse/re-serialize sequence to copy.

## Limitations to design around

- **1.12.2 is a downgrade-only target.** You can convert a modern schematic down to 1.12.2, but
  not the reverse — uploading an actual 1.12.2 source and converting it up is unsupported for
  blocks, signs, and items alike. See [architecture.md](architecture.md) for why.
- **Palette length never changes** across a conversion; a substitution replaces a palette entry
  in place. Don't rely on the output having fewer or more distinct block types than the input.
- Known open bug: cauldron `level` is lost on upgrade past its rename boundary —
  [issue #1](https://github.com/froyln/schem-convert-lib/issues/1).

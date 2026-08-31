const test = require('node:test');
const assert = require('node:assert/strict');
const nbt = require('prismarine-nbt');
const zlib = require('zlib');
const { convertFile, inspectFile } = require('../index');
const { loadBlockData, SUPPORTED } = require('../lib/versions');

function buildBuffer() {
  const root = {
    Version: { type: 'int', value: 7 },
    MinecraftDataVersion: { type: 'int', value: 4189 }, // 1.21.4
    Regions: {
      type: 'compound',
      value: {
        Main: {
          type: 'compound',
          value: {
            BlockStatePalette: {
              type: 'list',
              value: {
                type: 'compound',
                value: [
                  { Name: { type: 'string', value: 'minecraft:air' } },
                  { Name: { type: 'string', value: 'minecraft:vault' } },
                ],
              },
            },
          },
        },
      },
    },
  };
  const uncompressed = nbt.writeUncompressed({ type: 'compound', name: '', value: root });
  return zlib.gzipSync(uncompressed);
}

test('inspectFile reads version info out of a gzipped buffer', async () => {
  const info = await inspectFile(buildBuffer());
  assert.equal(info.nbtVersion, 7);
  assert.equal(info.dataVersion, 4189);
  assert.equal(info.label, '1.21.4');
});

test('convertFile round-trips: output re-parses with a length-invariant palette', async () => {
  const { buffer, report } = await convertFile(buildBuffer(), '1.13.2');

  const { parsed } = await nbt.parse(zlib.gunzipSync(buffer));
  const root = parsed.value;
  const target = loadBlockData('1.13.2');

  assert.equal(root.Version.value, SUPPORTED['1.13.2']);
  assert.equal(root.MinecraftDataVersion.value, target.dataVersion);

  const palette = root.Regions.value.Main.value.BlockStatePalette.value.value;
  assert.equal(palette.length, 2); // invariant
  assert.equal(palette[1].Name.value, 'minecraft:command_block'); // vault has no 1.13 equivalent

  assert.equal(typeof report.blockLines, 'function');
});

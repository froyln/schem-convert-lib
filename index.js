// Public entry point: Buffer in, Buffer out. Consumers that already hold a
// parsed NBT root (e.g. because they need to inspect/mutate it themselves)
// can skip straight to convertSchematic.

const nbt = require('prismarine-nbt');
const zlib = require('zlib');
const { convertSchematic } = require('./lib/convert');
const { SUPPORTED, PRE_FLATTENING_MC_VERSION, describeSource } = require('./lib/versions');

// inspectFile(buffer) -> { nbtVersion, dataVersion, label }
async function inspectFile(buffer) {
  const inflated = zlib.gunzipSync(buffer);
  const { parsed } = await nbt.parse(inflated);
  const root = parsed.value;
  const nbtVersion = root.Version ? root.Version.value : 0;
  const dataVersion = root.MinecraftDataVersion ? root.MinecraftDataVersion.value : 0;
  return { nbtVersion, dataVersion, label: describeSource(nbtVersion, dataVersion) };
}

// convertFile(buffer, toMcVersion) -> { buffer, report }
async function convertFile(buffer, toMcVersion) {
  const inflated = zlib.gunzipSync(buffer);
  const data = await nbt.parse(inflated);
  const root = data.parsed.value;
  const fromDataVersion = root.MinecraftDataVersion ? root.MinecraftDataVersion.value : 0;

  const report = convertSchematic(root, fromDataVersion, toMcVersion);

  const outputUncompressed = nbt.writeUncompressed(data.parsed);
  const outputBuffer = zlib.gzipSync(outputUncompressed);
  return { buffer: outputBuffer, report };
}

module.exports = {
  convertFile,
  inspectFile,
  convertSchematic,
  SUPPORTED,
  PRE_FLATTENING_MC_VERSION,
};

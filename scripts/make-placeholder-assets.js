/**
 * Genera PNGs placeholder válidos (color sólido) para icon/splash/favicon.
 * TODO(jhonatan): reemplazar con arte real en estilo cómic.
 * Uso: node scripts/make-placeholder-assets.js
 */
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

function crcTable() {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
}
const TABLE = crcTable();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}
function makePNG(width, height, [r, g, b]) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // color type RGB
  // 10,11,12 = compression/filter/interlace = 0
  const rowLen = width * 3;
  const raw = Buffer.alloc((rowLen + 1) * height);
  for (let y = 0; y < height; y++) {
    const off = y * (rowLen + 1);
    raw[off] = 0; // filter none
    for (let x = 0; x < width; x++) {
      const p = off + 1 + x * 3;
      raw[p] = r;
      raw[p + 1] = g;
      raw[p + 2] = b;
    }
  }
  const idat = zlib.deflateSync(raw);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const GREEN = [27, 58, 47]; // #1B3A2F
const outDir = path.join(__dirname, '..', 'assets');
fs.mkdirSync(outDir, { recursive: true });

const targets = [
  ['icon.png', 1024, 1024],
  ['adaptive-icon.png', 1024, 1024],
  ['splash.png', 1242, 2436],
  ['favicon.png', 48, 48],
];
for (const [name, w, h] of targets) {
  fs.writeFileSync(path.join(outDir, name), makePNG(w, h, GREEN));
  console.log('wrote', name, `${w}x${h}`);
}

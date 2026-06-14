/**
 * Utilidades base64 <-> bytes sin depender de Buffer/atob (no siempre
 * disponibles en RN). Se usan para envolver el PCM de Gemini TTS en un WAV.
 */

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
const LOOKUP = (() => {
  const t = new Uint8Array(256);
  for (let i = 0; i < CHARS.length; i++) t[CHARS.charCodeAt(i)] = i;
  return t;
})();

export function base64ToBytes(b64: string): Uint8Array {
  const clean = b64.replace(/[^A-Za-z0-9+/]/g, '');
  const len = clean.length;
  const pad = clean.endsWith('==') ? 2 : clean.endsWith('=') ? 1 : 0;
  const byteLen = Math.floor((len * 3) / 4) - pad;
  const bytes = new Uint8Array(byteLen);

  let p = 0;
  for (let i = 0; i < len; i += 4) {
    const e1 = LOOKUP[clean.charCodeAt(i)];
    const e2 = LOOKUP[clean.charCodeAt(i + 1)];
    const e3 = LOOKUP[clean.charCodeAt(i + 2)];
    const e4 = LOOKUP[clean.charCodeAt(i + 3)];

    if (p < byteLen) bytes[p++] = (e1 << 2) | (e2 >> 4);
    if (p < byteLen) bytes[p++] = ((e2 & 15) << 4) | (e3 >> 2);
    if (p < byteLen) bytes[p++] = ((e3 & 3) << 6) | e4;
  }
  return bytes;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result +=
      CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + CHARS[n & 63];
  }
  const rem = bytes.length - i;
  if (rem === 1) {
    const n = bytes[i] << 16;
    result += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + '==';
  } else if (rem === 2) {
    const n = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result += CHARS[(n >> 18) & 63] + CHARS[(n >> 12) & 63] + CHARS[(n >> 6) & 63] + '=';
  }
  return result;
}

/**
 * Envuelve PCM de 16-bit (signed, little-endian) en un contenedor WAV.
 * Gemini TTS devuelve audio/L16 a ~24000 Hz, mono.
 */
export function pcm16ToWav(
  pcm: Uint8Array,
  sampleRate = 24000,
  channels = 1,
): Uint8Array {
  const bitsPerSample = 16;
  const blockAlign = (channels * bitsPerSample) / 8;
  const byteRate = sampleRate * blockAlign;
  const dataSize = pcm.length;
  const buffer = new Uint8Array(44 + dataSize);
  const view = new DataView(buffer.buffer);

  const writeStr = (offset: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(offset + i, s.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM fmt chunk size
  view.setUint16(20, 1, true); // audio format = PCM
  view.setUint16(22, channels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitsPerSample, true);
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);
  buffer.set(pcm, 44);

  return buffer;
}

/** Extrae el sampleRate de un mimeType tipo "audio/L16;rate=24000". */
export function sampleRateFromMime(mime?: string): number {
  if (!mime) return 24000;
  const m = /rate=(\d+)/.exec(mime);
  return m ? parseInt(m[1], 10) : 24000;
}

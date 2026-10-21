import { crc32, deflateSync } from 'node:zlib';

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/**
 * RGB PNG of random noise: noise doesn't compress, so the file is about `side² × 3` bytes,
 * like the multi-megabyte images AI tools export.
 */
export function largePng(side: number): Buffer {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(side, 0);
  header.writeUInt32BE(side, 4);
  header.writeUInt8(8, 8); // bit depth
  header.writeUInt8(2, 9); // RGB

  const row = side * 3 + 1;
  const pixels = Buffer.alloc(row * side);
  for (let y = 0; y < side; y++) {
    pixels[y * row] = 0; // filter: none
    crypto.getRandomValues(pixels.subarray(y * row + 1, (y + 1) * row));
  }

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(pixels, { level: 1 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

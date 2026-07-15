import { promises as fs } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, '..', 'public');

async function generateFavicon() {
  const source = join(publicDir, 'plush.png');
  const metadata = await sharp(source).metadata();
  const size = Math.min(metadata.width, metadata.height);

  // Generate a square centered crop from the source.
  const base = sharp(source)
    .resize(size, size, { fit: 'cover', position: 'center' })
    .png({ compressionLevel: 9, adaptiveFiltering: true, force: true });

  const sizes = [16, 32, 48, 64, 128, 192, 256];
  const icoBuffers = [];

  for (const s of sizes) {
    const buf = await base.clone().resize(s, s, { fit: 'cover' }).toBuffer();
    icoBuffers.push({ size: s, buf });
  }

  // Simple ICO writer (BMP encoded DIB, no PNG icon support for max compatibility).
  const ico = writeIco(icoBuffers);
  await fs.writeFile(join(publicDir, 'favicon.ico'), ico);

  // Standalone PNG favicons for modern browsers.
  await base.clone().resize(32, 32).toFile(join(publicDir, 'favicon-32x32.png'));
  await base.clone().resize(16, 16).toFile(join(publicDir, 'favicon-16x16.png'));
  await base.clone().resize(180, 180).toFile(join(publicDir, 'apple-touch-icon.png'));

  console.log('Favicon assets generated.');
}

async function generateWebp() {
  const source = join(publicDir, 'plush.png');
  const target = join(publicDir, 'plush.webp');

  // Use near-lossless WebP for the best quality/size trade-off while keeping
  // transparency. `nearLossless: true` keeps visually lossless output.
  await sharp(source).webp({ nearLossless: true, effort: 6 }).toFile(target);

  const original = await fs.stat(source);
  const optimized = await fs.stat(target);
  console.log(
    `WebP generated: ${(original.size / 1024).toFixed(1)} KB PNG → ${(optimized.size / 1024).toFixed(1)} KB WebP`,
  );
}

function writeIco(images) {
  // ICO header: Reserved (2), Type (2), Count (2)
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);

  const dirSize = 16 * images.length;
  let dataOffset = 6 + dirSize;
  const dir = Buffer.alloc(dirSize);
  const dataBuffers = [];

  images.forEach(({ size, buf }, i) => {
    const offset = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, offset + 0); // Width
    dir.writeUInt8(size >= 256 ? 0 : size, offset + 1); // Height
    dir.writeUInt8(0, offset + 2); // Colors in palette
    dir.writeUInt8(0, offset + 3); // Reserved
    dir.writeUInt16LE(1, offset + 4); // Color planes
    dir.writeUInt16LE(32, offset + 6); // Bits per pixel
    dir.writeUInt32LE(buf.length, offset + 8); // Size of image data
    dir.writeUInt32LE(dataOffset, offset + 12); // Offset to data
    dataBuffers.push(buf);
    dataOffset += buf.length;
  });

  return Buffer.concat([header, dir, ...dataBuffers]);
}

async function main() {
  await fs.mkdir(publicDir, { recursive: true });
  await generateFavicon();
  await generateWebp();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

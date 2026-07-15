import { promises as fs } from 'node:fs';
import { join, parse } from 'node:path';
import sharp from 'sharp';

/**
 * Vite plugin that optimizes raster images copied from the public directory into
 * the production build. PNGs are recompressed with sharp and, when a matching
 * WebP version already exists in public, the WebP is also recompressed.
 */
export function imageOptimizer() {
  return {
    name: 'image-optimizer',
    apply: 'build',

    async writeBundle(options, bundle) {
      const outDir = options.dir || 'dist';
      const entries = Object.entries(bundle);
      const imageFiles = entries.filter(([name, item]) => {
        if (item.type !== 'asset') return false;
        const ext = parse(name).ext.toLowerCase();
        return ['.png', '.webp', '.jpg', '.jpeg'].includes(ext);
      });

      for (const [fileName] of imageFiles) {
        const filePath = join(outDir, fileName);
        const ext = parse(fileName).ext.toLowerCase();

        try {
          let input = sharp(filePath);

          if (ext === '.png') {
            input = input.png({ compressionLevel: 9, adaptiveFiltering: true, force: true });
          } else if (ext === '.webp') {
            input = input.webp({ nearLossless: true, effort: 6, force: true });
          } else if (['.jpg', '.jpeg'].includes(ext)) {
            input = input.jpeg({ mozjpeg: true, quality: 90, force: true });
          }

          const buf = await input.toBuffer();
          const before = (await fs.stat(filePath)).size;
          await fs.writeFile(filePath, buf);
          const after = buf.length;

          if (before !== after) {
            console.log(
              `optimized ${fileName}: ${(before / 1024).toFixed(1)} KB → ${(after / 1024).toFixed(1)} KB`,
            );
          }
        } catch (err) {
          console.warn(`failed to optimize ${fileName}:`, err.message);
        }
      }
    },
  };
}

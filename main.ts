// Gobble & Go — The Great Turkey Escape: make.fun turkey-run-game-01 entry program.
// Node 22, standard library only. Copies game/ and screenshots/ from beside this file
// to /output (MAKEFUN_OUTPUT_DIR outside the grader) and writes /output/dossier.json
// with the vendored make.fun library, after validating the screenshots against the
// gate's caps (3–4 images, each at most 256 KiB, PNG or JPEG).

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

const MAX_SHOT_BYTES = 262144;
const PNG_MAGIC = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];

function pngSize(buf: Buffer): { w: number; h: number } {
  // IHDR sits right after the 8-byte magic: length(4) + "IHDR" + width(4) + height(4)
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

function jpegSize(buf: Buffer): { w: number; h: number } {
  let i = 2;
  while (i + 9 < buf.length) {
    if (buf[i] !== 0xff) throw new Error('malformed JPEG marker');
    const marker = buf[i + 1];
    const len = buf.readUInt16BE(i + 2);
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { h: buf.readUInt16BE(i + 5), w: buf.readUInt16BE(i + 7) };
    }
    i += 2 + len;
  }
  throw new Error('no JPEG frame header found');
}

function checkScreenshots(dir: string): void {
  const names = readdirSync(dir).filter((n) => !n.startsWith('.')).sort();
  if (names.length < 3 || names.length > 4) {
    throw new Error(`screenshots/ must hold 3 or 4 images, found ${names.length}`);
  }
  for (const name of names) {
    const path = join(dir, name);
    const size = statSync(path).size;
    if (size > MAX_SHOT_BYTES) {
      throw new Error(`screenshot ${name} is ${size} bytes, over the 256 KiB cap`);
    }
    const buf = readFileSync(path);
    const isPng = PNG_MAGIC.every((b, i) => buf[i] === b);
    const isJpeg = buf[0] === 0xff && buf[1] === 0xd8;
    if (!isPng && !isJpeg) {
      throw new Error(`screenshot ${name} is neither PNG nor JPEG`);
    }
    const { w, h } = isPng ? pngSize(buf) : jpegSize(buf);
    const longSide = Math.max(w, h);
    const shortSide = Math.min(w, h);
    if (longSide > 1280 || shortSide < 480) {
      throw new Error(`screenshot ${name} is ${w}x${h}, outside the gate's 1280/480 side caps`);
    }
  }
}

mkdirSync(out, { recursive: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
checkScreenshots(join(out, 'screenshots'));

writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);

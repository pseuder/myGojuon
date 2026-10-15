// 將 public/thumbnails 下的 jpg/png 縮圖並轉成 WebP（同檔名、副檔名 .webp）
// 用法：node scripts/convert-thumbnails.js [--force]
// 預設只轉換「沒有 .webp」或「原圖比 .webp 新」的檔案；--force 全部重轉
import { readdir, stat } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const DIR = path.resolve(ROOT, "public", "thumbnails");

// 卡片最大顯示寬度 384px，給 2x 螢幕用 768px
const MAX_WIDTH = 768;
const QUALITY = 78;
const SOURCE_EXTS = new Set([".jpg", ".jpeg", ".png"]);

const force = process.argv.includes("--force");

const mtimeOrNull = async (file) => {
  try {
    return (await stat(file)).mtimeMs;
  } catch {
    return null;
  }
};

const files = (await readdir(DIR)).filter((f) =>
  SOURCE_EXTS.has(path.extname(f).toLowerCase()),
);

let converted = 0;
let skipped = 0;
let totalBefore = 0;
let totalAfter = 0;

for (const file of files) {
  const src = path.join(DIR, file);
  const dest = path.join(DIR, path.parse(file).name + ".webp");

  const srcTime = await mtimeOrNull(src);
  const destTime = await mtimeOrNull(dest);
  if (!force && destTime !== null && destTime >= srcTime) {
    skipped++;
    continue;
  }

  await sharp(src)
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .webp({ quality: QUALITY })
    .toFile(dest);

  const before = (await stat(src)).size;
  const after = (await stat(dest)).size;
  totalBefore += before;
  totalAfter += after;
  converted++;
  console.log(
    `${file} -> ${path.basename(dest)}  ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB`,
  );
}

console.log(
  `\n轉換 ${converted} 張，略過 ${skipped} 張` +
    (converted
      ? `，${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(0)}KB`
      : ""),
);

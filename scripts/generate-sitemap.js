// 從後端 API 抓取所有公開歌手與歌曲，產生 public/sitemap.xml
// 用法：node scripts/generate-sitemap.js
// 可用環境變數覆寫：SITE_BASE、API_BASE（否則使用 .env.production 的值，再退回預設）
import { readFile, writeFile, access } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT_PATH = path.resolve(ROOT, "public", "sitemap.xml");

// 讀 .env.production 取得與正式站一致的設定
const loadEnvFile = async (file) => {
  try {
    const text = await readFile(path.resolve(ROOT, file), "utf-8");
    return Object.fromEntries(
      text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter((l) => l && !l.startsWith("#") && l.includes("="))
        .map((l) => {
          const i = l.indexOf("=");
          return [
            l.slice(0, i).trim(),
            l
              .slice(i + 1)
              .trim()
              .split(/\s+#/)[0],
          ];
        }),
    );
  } catch {
    return {};
  }
};

const envProd = await loadEnvFile(".env.production");
const strip = (s) => s.replace(/\/$/, "");
const SITE_BASE = strip(
  process.env.SITE_BASE || envProd.VITE_SITE_BASE || "https://mygojuon.com",
);
const API_BASE = strip(
  process.env.API_BASE ||
    envProd.VITE_API_BASE ||
    "https://mygojuon.com/srv_mygojuon",
);

const STATIC_PAGES = [
  "/",
  "/WritingPractice",
  "/ListeningPractice",
  "/SongOverview",
];

const escapeXml = (str) =>
  str.replace(
    /[<>&'"]/g,
    (c) =>
      ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;",
      })[c],
  );

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`請求失敗: ${url} (${res.status})`);
  const body = await res.json();
  if (body.status && body.status !== "success") {
    throw new Error(`API 錯誤: ${url} -> ${body.message}`);
  }
  return body.data ?? [];
};

const toEnPath = (p) => (p === "/" ? "/en" : `/en${p}`);

// 每個頁面輸出中、英文兩筆，並以 xhtml:link 互相標示 hreflang
const buildUrlEntries = (zhPath) => {
  const zh = `${SITE_BASE}${zhPath}`;
  const en = `${SITE_BASE}${toEnPath(zhPath)}`;
  const alternates = [
    ["zh-TW", zh],
    ["en", en],
    ["x-default", zh],
  ]
    .map(
      ([lang, href]) =>
        `    <xhtml:link rel="alternate" hreflang="${lang}" href="${escapeXml(href)}" />`,
    )
    .join("\n");
  // 不輸出 lastmod：API 的歌曲清單沒有可靠的更新時間，與其填假日期不如省略（Google 會忽略不可信的 lastmod）
  return [zh, en]
    .map(
      (loc) =>
        `  <url>\n    <loc>${escapeXml(loc)}</loc>\n${alternates}\n  </url>`,
    )
    .join("\n");
};

async function build() {
  const paths = [...STATIC_PAGES];

  console.log(`API: ${API_BASE}`);
  console.log("正在取得歌手清單...");
  const artists = (await fetchJson(`${API_BASE}/get_artists_list`)).filter(
    (a) => a.artist_is_public !== false,
  );
  console.log(`共 ${artists.length} 位公開歌手`);

  const seen = new Set();
  for (const artist of artists) {
    const songs = await fetchJson(
      `${API_BASE}/get_artist_songs?artist_id=${encodeURIComponent(artist.artist_id)}`,
    );
    for (const song of songs) {
      if (!song.source_id || song.is_public === false) continue;
      if (seen.has(song.source_id)) continue;
      seen.add(song.source_id);
      paths.push(`/SongPractice/${encodeURIComponent(song.source_id)}`);
    }
  }
  console.log(`共 ${seen.size} 首公開歌曲`);

  if (seen.size === 0)
    throw new Error("沒有取得任何歌曲，放棄寫入以免覆蓋成空 sitemap");

  const xml =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n` +
    `${paths.map(buildUrlEntries).join("\n")}\n</urlset>\n`;

  await writeFile(OUT_PATH, xml, "utf-8");
  console.log(`已寫入 ${OUT_PATH}，共 ${paths.length * 2} 個網址`);
}

try {
  await build();
} catch (err) {
  console.error(`產生 sitemap 失敗: ${err.message}`);
  // 已有舊檔時不中斷 build，沿用上一版 sitemap
  try {
    await access(OUT_PATH);
    console.warn(`沿用既有的 ${OUT_PATH}`);
  } catch {
    process.exit(1);
  }
}

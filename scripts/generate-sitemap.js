// 從後端 API 抓取所有歌手與歌曲，產生 public/sitemap.xml
import { writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const SITE_BASE = (process.env.SITE_BASE || "https://mygojuon.vercel.app").replace(/\/$/, "");
const API_BASE = (process.env.API_BASE || "https://pseuder.com/srv_mygojuon3").replace(/\/$/, "");

const STATIC_PAGES = [
  { path: "/", priority: "1.0" },
  { path: "/WritingPractice", priority: "0.8" },
  { path: "/ListeningPractice", priority: "0.8" },
  { path: "/SongOverview", priority: "0.8" },
];

const SONG_PRIORITY = "0.6";

const escapeXml = (str) =>
  str.replace(/[<>&'"]/g, (c) =>
    ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" })[c],
  );

const formatDate = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(d.getTime())) return new Date().toISOString().slice(0, 10);
  return d.toISOString().slice(0, 10);
};

const fetchJson = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`請求失敗: ${url} (${res.status})`);
  const body = await res.json();
  if (body.status && body.status !== "success") {
    throw new Error(`API 錯誤: ${url} -> ${body.message}`);
  }
  return body.data;
};

const buildUrlEntry = (loc, lastmod, priority) =>
  `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <priority>${priority}</priority>\n  </url>`;

async function main() {
  const today = new Date().toISOString().slice(0, 10);
  const entries = STATIC_PAGES.map((p) =>
    buildUrlEntry(`${SITE_BASE}${p.path}`, today, p.priority),
  );

  console.log("正在取得歌手清單...");
  const artists = await fetchJson(`${API_BASE}/get_artists_list`);
  console.log(`共 ${artists.length} 位歌手`);

  let songCount = 0;
  for (const artist of artists) {
    const songs = await fetchJson(`${API_BASE}/get_artist_songs?artist_id=${artist.artist_id}`);
    for (const song of songs) {
      if (!song.source_id) continue;
      songCount++;
      const loc = `${SITE_BASE}/SongPractice/${encodeURIComponent(song.source_id)}`;
      entries.push(buildUrlEntry(loc, formatDate(song.update_time), SONG_PRIORITY));
    }
  }
  console.log(`共 ${songCount} 首歌曲`);

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const outPath = path.resolve(__dirname, "..", "public", "sitemap.xml");
  await writeFile(outPath, xml, "utf-8");
  console.log(`已寫入 ${outPath}，共 ${entries.length} 個網址`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

// api/song.js
import fs from 'fs';
import path from 'path';

const baseHtml = fs.readFileSync(
    path.join(process.cwd(), 'dist/index.html'),
    'utf-8'
);

const esc = s => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export default async function handler(req, res) {
    const { source_id } = req.query;

    try {
        const json = await fetch(
            `https://pseuder.com/srv_mygojuon3/get_song/${source_id}`
        ).then(r => r.json());

        // 後端找不到歌或回非 success → 退回空殼
        if (json.status !== 'success' || !json.data) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
            return res.send(baseHtml);
        }

        const d = json.data;
        const title = `${d.name} - ${d.artists}`;
        // converted 是完整歌詞,截前 120 字當描述,去掉換行
        const desc = esc(
            (d.converted || '').replace(/\s+/g, ' ').slice(0, 120)
        ) || esc(`${d.artists} - ${d.name}`);
        // YouTube 縮圖當社群預覽圖(source_id 看起來就是 YouTube ID)
        const ogImage = `https://i.ytimg.com/vi/${esc(d.source_id)}/hqdefault.jpg`;

        const meta = `
      <title>${esc(title)}</title>
      <meta name="description" content="${desc}">
      <meta name="keywords" content="${esc(d.name)},${esc(d.artists)},${esc(d.tags)},歌詞">
      <meta property="og:type" content="music.song">
      <meta property="og:title" content="${esc(title)}">
      <meta property="og:description" content="${desc}">
      <meta property="og:image" content="${ogImage}">
      <meta property="og:url" content="https://my-gojuon.vercel.app/SongPractice/${esc(d.source_id)}">
      <meta name="twitter:card" content="summary_large_image">
      <meta name="twitter:title" content="${esc(title)}">
      <meta name="twitter:description" content="${desc}">
      <meta name="twitter:image" content="${ogImage}">`;

        const html = baseHtml.replace('<!--ssr-meta-->', meta);

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=3600');
        res.send(html);
    } catch (e) {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(baseHtml);
    }
}
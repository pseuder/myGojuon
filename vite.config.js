import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import fs from "fs";

// 把 public/gifs 內的檔名清單做成虛擬模組，新增 GIF 檔後不必手動維護清單
const lyricGifsPlugin = () => {
  const VIRTUAL_ID = "virtual:lyric-gifs";
  const RESOLVED_ID = "\0" + VIRTUAL_ID;
  const gifDir = path.resolve(__dirname, "public/gifs");

  const listGifs = () =>
    fs.existsSync(gifDir)
      ? fs
          .readdirSync(gifDir)
          .filter((file) => file.toLowerCase().endsWith(".gif"))
          .map((file) => file.slice(0, -4))
          .sort()
      : [];

  return {
    name: "lyric-gifs",
    resolveId: (id) => (id === VIRTUAL_ID ? RESOLVED_ID : null),
    load: (id) =>
      id === RESOLVED_ID
        ? `export default ${JSON.stringify(listGifs())};`
        : null,
    configureServer(server) {
      // 開發時新增/刪除 GIF 檔就重新整理清單
      const onChange = (file) => {
        if (!path.resolve(file).startsWith(gifDir)) return;
        const mod = server.moduleGraph.getModuleById(RESOLVED_ID);
        if (mod) server.moduleGraph.invalidateModule(mod);
        server.ws.send({ type: "full-reload" });
      };
      server.watcher.on("add", onChange);
      server.watcher.on("unlink", onChange);
    },
  };
};

export default defineConfig({
  plugins: [vue(), tailwindcss(), lyricGifsPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "~": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    // 預設 5173；可由 PORT 環境變數覆寫（預覽工具會指定）
    port: Number(process.env.PORT) || 5173,
  },
});

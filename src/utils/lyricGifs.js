// 歌詞中可插入的 GIF：清單來自 public/gifs（見 vite.config.js 的 lyric-gifs 外掛）
// 歌詞 token 格式：{ cvt: "", ori: "", gif: "clap", gifSize?: 64 }
import gifNames from "virtual:lyric-gifs";

export const LYRIC_GIFS = gifNames;

// GIF 顯示高度（px），token 沒有 gifSize 時使用
export const DEFAULT_GIF_SIZE = 48;

export const gifUrl = (name) => `/gifs/${name}.gif`;

export const gifSize = (token) => token.gifSize || DEFAULT_GIF_SIZE;

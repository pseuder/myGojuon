import { useRoute } from "vue-router";

export const EN_PREFIX = /^\/en(?=\/|$)/;

export const isEnPath = (path) => EN_PREFIX.test(path);

// 取得某路徑在指定語言下的版本（只處理路徑，不含 query / hash）
export const toLangPath = (path, lang) => {
  const zhPath = path.replace(EN_PREFIX, "") || "/";
  if (lang !== "en") return zhPath;
  return zhPath === "/" ? "/en" : `/en${zhPath}`;
};

// 依目前網址是否在 /en 底下，替站內路徑補上語言前綴，避免從英文頁點連結跳回中文版
export function useLocalePath() {
  const route = useRoute();
  return (path) => {
    if (!isEnPath(route.path)) return path;
    if (isEnPath(path)) return path;
    return toLangPath(path, "en");
  };
}

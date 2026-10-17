import { createRouter, createWebHistory } from "vue-router";

const SITE_BASE = "https://mygojuon.com";

const routes = [
  { path: "/", component: () => import("@/views/Home.vue") },
  {
    path: "/WritingPractice",
    component: () => import("@/views/WritingPractice.vue"),
  },
  {
    path: "/ListeningPractice",
    component: () => import("@/views/ListeningPractice.vue"),
  },
  {
    path: "/SongOverview",
    component: () => import("@/views/SongOverview.vue"),
  },
  {
    path: "/SongPractice/:uid",
    name: "songPractice",
    component: () => import("@/views/SongPractice.vue"),
  },
  {
    path: "/S/:video_id",
    name: "songEdit",
    component: () => import("@/views/SongEdit.vue"),
    meta: { noindex: true },
  },
  {
    path: "/Backend",
    component: () => import("@/views/Backend.vue"),
    meta: { noindex: true },
  },
  // i18n prefix routes (簡易支援 /en/ 前綴)
  { path: "/en", component: () => import("@/views/Home.vue") },
  {
    path: "/en/WritingPractice",
    component: () => import("@/views/WritingPractice.vue"),
  },
  {
    path: "/en/ListeningPractice",
    component: () => import("@/views/ListeningPractice.vue"),
  },
  {
    path: "/en/SongOverview",
    component: () => import("@/views/SongOverview.vue"),
  },
  {
    path: "/en/SongPractice/:uid",
    name: "songPracticeEn",
    component: () => import("@/views/SongPractice.vue"),
  },
  // 舊網址相容
  { path: "/index.html", redirect: "/" },
  // 404：保留原網址、顯示找不到頁面並標記 noindex，不再轉址回首頁
  {
    path: "/:pathMatch(.*)*",
    name: "notFound",
    component: () => import("@/views/NotFound.vue"),
    meta: { noindex: true },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 依路由切換 <meta name="robots"> 與 canonical
const setRobotsMeta = (noindex) => {
  let tag = document.querySelector('meta[name="robots"]');
  if (noindex) {
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", "robots");
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", "noindex, nofollow");
  } else if (tag) {
    tag.remove();
  }
};

const EN_PREFIX = /^\/en(?=\/|$)/;

// 取得或建立 <head> 內的單一標籤
const upsertHead = (selector, create) => {
  let el = document.querySelector(selector);
  if (!el) {
    el = create();
    document.head.appendChild(el);
  }
  return el;
};

// 設定中英文互為 alternate 的 hreflang（只在兩種語言都有對應頁面時輸出）
const setHreflang = (zhPath, hasEn) => {
  document.querySelectorAll("link[hreflang]").forEach((el) => el.remove());
  if (!hasEn) return;
  const enPath = zhPath === "/" ? "/en" : `/en${zhPath}`;
  [
    ["zh-TW", zhPath],
    ["en", enPath],
    ["x-default", zhPath],
  ].forEach(([lang, path]) => {
    const link = document.createElement("link");
    link.rel = "alternate";
    link.hreflang = lang;
    link.href = `${SITE_BASE}${path}`;
    document.head.appendChild(link);
  });
};

router.afterEach((to) => {
  const noindex = Boolean(to.meta.noindex);
  setRobotsMeta(noindex);

  const isEn = EN_PREFIX.test(to.path);
  const zhPath = to.path.replace(EN_PREFIX, "") || "/";

  upsertHead('meta[property="og:locale"]', () => {
    const m = document.createElement("meta");
    m.setAttribute("property", "og:locale");
    return m;
  }).setAttribute("content", isEn ? "en_US" : "zh_TW");

  if (noindex) {
    document.querySelector('link[rel="canonical"]')?.remove();
    setHreflang(zhPath, false);
    return;
  }

  // canonical 指向自己：中英文是不同語言的頁面，不是重複內容
  upsertHead('link[rel="canonical"]', () => {
    const l = document.createElement("link");
    l.rel = "canonical";
    return l;
  }).setAttribute("href", `${SITE_BASE}${to.path}`);

  const enPath = zhPath === "/" ? "/en" : `/en${zhPath}`;
  const hasEn = router.resolve(enPath).name !== "notFound";
  setHreflang(zhPath, hasEn);
});

export default router;

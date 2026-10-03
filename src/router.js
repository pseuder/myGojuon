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

router.afterEach((to) => {
  const noindex = Boolean(to.meta.noindex);
  setRobotsMeta(noindex);

  const canonical = document.querySelector('link[rel="canonical"]');
  if (canonical) {
    if (noindex) {
      canonical.remove();
    } else {
      canonical.setAttribute("href", `${SITE_BASE}${to.path}`);
    }
  }
});

export default router;

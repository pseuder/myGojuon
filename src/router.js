import { createRouter, createWebHistory } from "vue-router";

const routes = [
  { path: "/", component: () => import("@/views/Home.vue") },
  { path: "/WritingPractice", component: () => import("@/views/WritingPractice.vue") },
  { path: "/ListeningPractice", component: () => import("@/views/ListeningPractice.vue") },
  { path: "/SongOverview", component: () => import("@/views/SongOverview.vue") },
  { path: "/SongPractice/:uid", name: "songPractice", component: () => import("@/views/SongPractice.vue") },
  { path: "/S/:video_id", name: "songEdit", component: () => import("@/views/SongEdit.vue") },
  { path: "/Backend", component: () => import("@/views/Backend.vue") },
  { path: "/Analysis", component: () => import("@/views/Analysis.vue") },
  // i18n prefix routes (簡易支援 /en/ 前綴)
  { path: "/en", component: () => import("@/views/Home.vue") },
  { path: "/en/WritingPractice", component: () => import("@/views/WritingPractice.vue") },
  { path: "/en/ListeningPractice", component: () => import("@/views/ListeningPractice.vue") },
  { path: "/en/SongOverview", component: () => import("@/views/SongOverview.vue") },
  { path: "/en/SongPractice/:uid", name: "songPracticeEn", component: () => import("@/views/SongPractice.vue") },
  // Catch-all
  { path: "/:pathMatch(.*)*", redirect: "/" },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;

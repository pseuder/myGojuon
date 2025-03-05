<template>
  <div class="h-full relative">
    <nav class="navbar">
      <el-menu
        :default-active="activeIndex"
        class="w-full user-select-none overflow-hidden"
        mode="horizontal"
        router
      >
        <MenuItem index="/" :label="t('home')" />
        <MenuItem index="/writing" :label="t('handwriting_practice')" />
        <MenuItem index="/listening" :label="t('dictation_practice')" />
        <MenuItem
          index="/songOverview"
          :label="t('song_practice')"
          :condition="isAdmin"
        />
        <MenuItem
          index="/analysis"
          :label="t('activity_analysis')"
          :condition="isAdmin"
        />
        <MenuItem
          index="/backend"
          :label="t('admin_panel')"
          :condition="isAdmin"
        />
      </el-menu>

      <div class="flex items-center gap-4 flex-shrink-0">
        <LocaleSwitcher @update:locale="recordActivity" />
        <myGoogleLogin />
      </div>
    </nav>

    <main class="content">
      <!-- 文字瀑布 -->
      <div ref="textContainer" class="text-fall-container"></div>
      <div
        class="main-component relative"
        :class="{ 'wide-layout': isInSongPractice || isInBackend }"
      >
        <router-view> </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import fiftySoundsData from "@/data/fifty-sounds.json";
import axios, { getUserInfo } from "@/utils/axios";
import myGoogleLogin from "@/components/myGoogleLogin.vue";
import MenuItem from "@/components/MenuItem.vue";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";

const { t, locale } = useI18n();
const route = useRoute();
const activeIndex = ref("/");
const user = getUserInfo();

const isAdmin = computed(() => user?.email === "iop890520@gmail.com");

watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath;
  },
  { immediate: true }
);

watch(locale, (newLocale) => {
  document.documentElement.setAttribute("lang", newLocale);
});

const isInSongPractice = computed(() => route.path.includes("/songPractice"));
const isInBackend = computed(() => route.path.includes("/backend"));

// ===== 文字瀑布 =====
const TEXT_COUNT = 100; // 下落文字數量
const textContainer = ref(null);
const textArray = fiftySoundsData.hiragana
  .map((item) => item.kana)
  .concat(fiftySoundsData.katakana.map((item) => item.kana))
  .concat(fiftySoundsData.dakuon.map((item) => item.kana))
  .concat(fiftySoundsData.handakuon.map((item) => item.kana));

const recordActivity = (lang) => {
  const dataToSend = {
    learningModule: "language",
    learningMethod: "switch_language",
    learningItem: lang,
  };
  axios.post("/record_activity", dataToSend).catch((error) => {
    console.error("Error recording activity:", error);
  });
};

onMounted(() => {
  document.documentElement.setAttribute("lang", locale.value);
  if (!textContainer.value) return;
  let count = 0;
  function createTextElement() {
    if (count < TEXT_COUNT) {
      const textEl = document.createElement("div");
      textEl.classList.add("falling-text");
      textEl.innerText =
        textArray[Math.floor(Math.random() * textArray.length)];

      // --- 水平位置隨機 ---
      const startX = Math.random() * window.innerWidth;
      textEl.style.left = `${startX}px`;

      // --- 垂直位置隨機 (負值 => 讓它在容器頂端以上) ---
      const randomTop = -(Math.random() * 300 + 100);
      textEl.style.top = `${randomTop}px`;

      // --- 動畫時間＆延遲隨機 ---
      const duration = 3 + Math.random() * 5; // 3 ~ 8 秒
      const delay = Math.random() * 5; // 0 ~ 5 秒
      textEl.style.animationDuration = `${duration}s`;
      textEl.style.animationDelay = `${delay}s`;

      // --- 字體大小隨機 ---
      const fontSize = 16 + Math.random() * 30;
      textEl.style.fontSize = `${fontSize}px`;

      textContainer.value.appendChild(textEl);
      count++;
      requestAnimationFrame(createTextElement); // 使用 requestAnimationFrame
    }
  }
  requestAnimationFrame(createTextElement); // 開始創建
});
</script>

<style>
.navbar {
  height: fit-content;
  position: relative;
  z-index: 2;
  display: flex;
}

.content {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding: 20px;
  background-image: url("/images/gojuon-writing.jpg");
  background-size: cover;
  background-position: center;
  position: relative; /* 關鍵：用來相對定位瀑布 */
}

.main-component {
  position: relative;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  z-index: 2; /* 大於文字瀑布容器，確保主內容在文字上方 */
  max-width: 1000px;
  margin: auto;
}

.wide-layout {
  max-width: 90vw !important;
}

/* ---------------------------
   文字瀑布容器
---------------------------- */
.text-fall-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden; /* 隱藏超出的文字 */
  pointer-events: none; /* 不要阻擋滑鼠事件 */
  z-index: 1; /* 被 main-component (z-index:2) 蓋住 */
}

/* 下落文字的基本樣式 */
.falling-text {
  position: absolute;
  color: rgba(120, 100, 200);
  animation: fall linear infinite;
  white-space: nowrap;
  user-select: none;
}

/* 簡單的下落動畫 */
@keyframes fall {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(120vh);
    opacity: 0;
  }
}
</style>

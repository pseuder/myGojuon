<template>
  <div class="h-full relative">
    <nav class="navbar">
      <el-menu
        :default-active="activeIndex"
        class="w-full user-select-none overflow-hidden"
        mode="horizontal"
        router
      >
        <el-menu-item index="/">{{ t("home") }}</el-menu-item>
        <el-menu-item index="/writing">{{
          t("handwriting_practice")
        }}</el-menu-item>
        <el-menu-item index="/listening">{{
          t("dictation_practice")
        }}</el-menu-item>
        <el-menu-item
          index="/songOverview"
          v-if="user?.email === 'iop890520@gmail.com'"
          >{{ t("song_practice") }}</el-menu-item
        >
        <el-menu-item
          index="/analysis"
          v-if="user?.email === 'iop890520@gmail.com'"
        >
          <span>{{ t("activity_analysis") }}</span>
        </el-menu-item>
        <el-menu-item
          index="/backend"
          v-if="user?.email === 'iop890520@gmail.com'"
        >
          <el-icon><Setting /></el-icon>
          <span>{{ t("admin_panel") }}</span>
        </el-menu-item>
      </el-menu>

      <div class="flex items-center gap-4 flex-shrink-0">
        <div>
          <el-popover placement="bottom" :width="150" trigger="click">
            <el-menu
              class="user-select-none"
              :default-active="user?.locale || 'TW'"
              @select="handleSelectLocale"
            >
              <!-- 繁體中文 -->
              <el-menu-item index="TW">繁體中文</el-menu-item>
              <!-- 简体中文 -->
              <el-menu-item index="CN">简体中文</el-menu-item>
              <!-- 香港粵語 -->
              <el-menu-item index="HK">香港粵語</el-menu-item>
              <!-- English -->
              <el-menu-item index="EN">English</el-menu-item>
              <!-- Malaysia -->
              <el-menu-item index="MY">Melayu</el-menu-item>
              <!-- Vietnam -->
              <el-menu-item index="VN">Tiếng Việt</el-menu-item>
            </el-menu>

            <template #reference>
              <img
              title="language"
                src="/images/language.svg"
                alt="language"
                class="w-10 h-10 cursor-pointer transition-transform hover:scale-110"
              />
            </template>
          </el-popover>
        </div>
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
import { Setting } from "@element-plus/icons-vue";
import { getUserInfo } from "@/utils/axios";
import myGoogleLogin from "@/components/myGoogleLogin.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";

import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

const route = useRoute();
const activeIndex = ref("/");
const user = getUserInfo();

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
const textContainer = ref(null);

const textArray = fiftySoundsData.hiragana
  .map((item) => item.kana)
  .concat(fiftySoundsData.katakana.map((item) => item.kana))
  .concat(fiftySoundsData.dakuon.map((item) => item.kana))
  .concat(fiftySoundsData.handakuon.map((item) => item.kana));
const TEXT_COUNT = 100; // 下落文字數量

// --- 切換語系 ---
const handleSelectLocale = (lang) => {
  locale.value = lang;

  localStorage.setItem("myGojuon", JSON.stringify({ locale: lang }));
};

onMounted(() => {
  document.documentElement.setAttribute("lang", locale.value);

  if (!textContainer.value) return;

  for (let i = 0; i < TEXT_COUNT; i++) {
    const textEl = document.createElement("div");
    textEl.classList.add("falling-text");
    textEl.innerText = textArray[Math.floor(Math.random() * textArray.length)];

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
  }
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

/* 在 main 裡的下層可見 */
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

/* 簡單的下落動畫：可根據需求修改 */
@keyframes fall {
  0% {
    transform: translateY(0);
    opacity: 0;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translateY(120vh); /* 或 calc(100vh + 100px) */
    opacity: 0;
  }
}
</style>

<template>
  <div class="h-full w-full">
    <nav class="flex w-full">
      <div class="user-select-none w-[50%] grow">
        <el-menu :default-active="activeIndex" mode="horizontal" router>
          <MenuItem index="/" :label="t('home')" />
          <MenuItem
            index="/WritingPractice"
            :label="t('handwriting_practice')"
          />
          <MenuItem
            index="/ListeningPractice"
            :label="t('dictation_practice')"
          />
          <MenuItem index="/SongOverview" :label="t('song_practice')" />
        </el-menu>
      </div>
      <div class="flex w-fit items-center gap-4">
        <LocaleSwitcher />
        <myGoogleLogin v-model:textWaterfallEnabled="textWaterfallEnabled" />
      </div>
    </nav>

    <main class="content">
      <!-- 文字瀑布 -->
      <div ref="textContainer" class="text-fall-container"></div>
      <div
        class="main-component relative h-fit"
        :class="{
          'wide-layout':
            isInSongPractice || isInBackend || isInSongEdit || isInSongOverview,
        }"
      >
        <router-view />
      </div>
    </main>

    <!-- Floating Contact Button -->
    <div v-if="showFloatingButton" class="floating-contact-button">
      <el-button
        class="close-button"
        type="danger"
        plain
        @click.stop="showFloatingButton = false"
        link
      >
        <el-icon :size="18"><CloseBold /></el-icon>
      </el-button>

      <div @click="showContactForm = !showContactForm">
        <el-button
          type="warning"
          plain
          circle
          size="large"
          :title="t('anonymous_feedback')"
        >
          <el-icon :size="25"><ChatLineRound /></el-icon>
        </el-button>
      </div>
    </div>
    <ContactForm :visible="showContactForm" @close="showContactForm = false" />
  </div>
</template>

<script setup>
import { ref, watch, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChatLineRound, CloseBold } from "@element-plus/icons-vue";
import ContactForm from "@/components/ContactForm.vue";

import fiftySoundsData from "@/data/fifty-sounds.json";
import myGoogleLogin from "@/components/myGoogleLogin.vue";
import MenuItem from "@/components/MenuItem.vue";
import LocaleSwitcher from "@/components/LocaleSwitcher.vue";
import { useAuth } from "@/composables/useAuth.js";

// 初始化認證狀態
const { initializeAuth, user } = useAuth();
initializeAuth();

const showContactForm = ref(false);
const showFloatingButton = ref(true);

const { t, locale } = useI18n();
const route = useRoute();
const activeIndex = ref("/");

const isAdmin = computed(() => user.value?.email === "iop890520@gmail.com");

// 文字瀑布開關狀態
const textWaterfallEnabled = ref(true);

watch(
  () => route.path,
  (newPath) => {
    // 移除語言前綴
    const basePath = newPath.replace(/^\/(en)/, "") || "/";
    activeIndex.value = basePath;
  },
  { immediate: true },
);

const isInSongPractice = computed(() => route.path.includes("/SongPractice"));
const isInSongOverview = computed(() => route.path.includes("/SongOverview"));
const isInBackend = computed(() => route.path.includes("/Backend"));
const isInSongEdit = computed(
  () => route.path.includes("/S/") || route.path.includes("/s/"),
);

// ===== 文字瀑布 =====
const TEXT_COUNT = 100;
const textContainer = ref(null);
const textArray = fiftySoundsData.hiragana
  .map((item) => item.kana)
  .concat(fiftySoundsData.katakana.map((item) => item.kana));

const isDesktopDevice = () => {
  const userAgent = navigator.userAgent.toLowerCase();
  const mobileKeywords = [
    "android",
    "webos",
    "iphone",
    "ipad",
    "ipod",
    "blackberry",
    "windows phone",
  ];
  return !mobileKeywords.some((keyword) => userAgent.includes(keyword));
};

onMounted(() => {
  if (!textContainer.value) return;
  if (isDesktopDevice() && textWaterfallEnabled.value) {
    createTextWaterfall();
  }
});

function createTextWaterfall() {
  if (!textContainer.value) return;
  let count = 0;
  function createTextElement() {
    if (count < TEXT_COUNT) {
      const textEl = document.createElement("div");
      textEl.classList.add("falling-text");
      textEl.innerText =
        textArray[Math.floor(Math.random() * textArray.length)];
      const startX = Math.random() * window.innerWidth;
      textEl.style.left = `${startX}px`;
      const randomTop = -(Math.random() * 300 + 100);
      textEl.style.top = `${randomTop}px`;
      const duration = 3 + Math.random() * 5;
      const delay = Math.random() * 5;
      textEl.style.animationDuration = `${duration}s`;
      textEl.style.animationDelay = `${delay}s`;
      const fontSize = 16 + Math.random() * 30;
      textEl.style.fontSize = `${fontSize}px`;
      textContainer.value.appendChild(textEl);
      count++;
      requestAnimationFrame(createTextElement);
    }
  }
  requestAnimationFrame(createTextElement);
}

function clearTextWaterfall() {
  if (!textContainer.value) return;
  textContainer.value.innerHTML = "";
}

watch(textWaterfallEnabled, (newValue) => {
  if (!isDesktopDevice()) return;
  if (newValue) {
    createTextWaterfall();
  } else {
    clearTextWaterfall();
  }
});
</script>

<style>
@reference "tailwindcss";
.content {
  height: calc(100% - 60px);
  overflow-y: auto;
  padding: 20px;
  background-image: url("/images/gojuon-writing.jpg");
  background-size: cover;
  background-position: center;
  position: relative;
}

.main-component {
  position: relative;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
  z-index: 2;
  max-width: 1000px;
  margin: auto;
}

.wide-layout {
  max-width: 90vw !important;
}

@media (min-width: 1024px) {
  .wide-layout {
    height: 100%;
  }
}

.text-fall-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  pointer-events: none;
  z-index: 1;
}

.falling-text {
  position: absolute;
  color: rgba(120, 100, 200);
  animation: fall linear infinite;
  white-space: nowrap;
  user-select: none;
}

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

.floating-contact-button {
  position: fixed;
  bottom: 30px;
  right: 30px;
  z-index: 100;
  cursor: pointer;
}

.close-button {
  position: absolute;
  top: -8px;
  right: -8px;
  z-index: 101;
}
</style>

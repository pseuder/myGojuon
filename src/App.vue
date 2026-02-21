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
        <NavSetting />
        <myGoogleLogin v-model:textWaterfallEnabled="textWaterfallEnabled" />
      </div>
    </nav>

    <main class="content">
      <!-- 文字瀑布 -->
      <div ref="textContainer" class="text-fall-container"></div>
      <div
        class="main-component relative h-fit"
        :class="{
          'wide-layout': isWideLayout,
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
import { ref, watch, computed, onMounted, toRef } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { ChatLineRound, CloseBold } from "@element-plus/icons-vue";
import ContactForm from "@/components/ContactForm.vue";
import myGoogleLogin from "@/components/myGoogleLogin.vue";
import MenuItem from "@/components/MenuItem.vue";
import NavSetting from "@/components/NavSetting.vue";

/*-- 全域設定 --*/
import { useSettingsStore } from "@/stores/index.js";
const settingsStore = useSettingsStore();

/*-- 文字瀑布 --*/
import { useTextWaterfall } from "@/composables/useTextWaterfall";
const textContainer = ref(null);
useTextWaterfall(textContainer, toRef(settingsStore, "textfall"));

const { t, locale } = useI18n();
const route = useRoute();

const isWideLayout = computed(
  () =>
    route.path.includes("/SongOverview") ||
    route.path.includes("/SongPractice") ||
    route.path.includes("/Backend") ||
    route.path.includes("/backend") ||
    route.path.includes("/S/") ||
    route.path.includes("/s/"),
);

const showContactForm = ref(false);
const showFloatingButton = ref(true);
const activeIndex = computed(() => route.path);

onMounted(() => {});
</script>

<style>
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

<template>
  <div class="h-full w-full">
    <NavBar />

    <main class="content">
      <!-- 文字瀑布 -->
      <div ref="textContainer" class="text-fall-container"></div>
      <div
        class="main-component relative h-fit"
        :class="{
          'wide-layout': isWideLayout,
        }"
      >
        <router-view v-slot="{ Component }">
          <keep-alive include="SongOverview">
            <component :is="Component" />
          </keep-alive>
        </router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, toRef } from "vue";
import { useRoute } from "vue-router";
import NavBar from "@/components/NavBar.vue";

/*-- 全域設定 --*/
import { useSettingsStore, useAuthStore } from "@/stores/index.js";
const settingsStore = useSettingsStore();
const authStore = useAuthStore();

/*-- 文字瀑布 --*/
import { useTextWaterfall } from "@/composables/useTextWaterfall";
const textContainer = ref(null);
useTextWaterfall(textContainer, toRef(settingsStore, "textfall"));

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

onMounted(() => {
  authStore.fetchFreePredictTimes();
});
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
</style>

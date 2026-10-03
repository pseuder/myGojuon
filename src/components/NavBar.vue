<template>
  <nav class="flex w-full">
    <div class="user-select-none w-[50%] grow">
      <!-- 不用 el-menu 的 router 模式，改以 <router-link> 產生真正的 <a href>，讓搜尋引擎能爬到站內連結 -->
      <el-menu
        :default-active="activeIndex"
        mode="horizontal"
        :ellipsis="false"
      >
        <el-menu-item
          v-for="item in navItems"
          :key="item.path"
          :index="item.path"
          class="nav-item"
        >
          <router-link :to="item.path" class="flex h-full items-center gap-2">
            <img
              :src="item.icon"
              :alt="t(item.label)"
              class="h-5 w-5 shrink-0"
            />
            <span class="hidden md:inline">{{ t(item.label) }}</span>
          </router-link>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="mr-4 flex w-fit items-center gap-2">
      <NavSetting />
    </div>
  </nav>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";

import NavSetting from "@/components/NavSetting.vue";

const { t } = useI18n();
const route = useRoute();

const activeIndex = computed(() => route.path);

const navItems = [
  { path: "/", icon: "/images/home.svg", label: "home" },
  {
    path: "/WritingPractice",
    icon: "/images/writting.svg",
    label: "handwriting_practice",
  },
  {
    path: "/ListeningPractice",
    icon: "/images/listining.svg",
    label: "dictation_practice",
  },
  { path: "/SongOverview", icon: "/images/music.svg", label: "song_practice" },
];
</script>

<style scoped>
/* 讓 <a> 撐滿整個選單項目，點擊範圍與原本相同 */
.nav-item {
  padding: 0;
}
.nav-item > a {
  padding: 0 20px;
  color: inherit;
  text-decoration: none;
}
</style>

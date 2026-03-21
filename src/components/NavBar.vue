<template>
  <nav class="flex w-full">
    <div class="user-select-none w-[50%] grow">
      <el-menu :default-active="activeIndex" mode="horizontal" router>
        <el-menu-item index="/" class="flex items-center gap-2">
          <img src="/images/home.svg" class="w-5 h-5 shrink-0" />
          <span class="hidden md:inline">{{ t("home") }}</span>
        </el-menu-item>
        <el-menu-item index="/WritingPractice" class="flex items-center gap-2">
          <img src="/images/writting.svg" class="w-5 h-5 shrink-0" />
          <span class="hidden md:inline">{{ t("handwriting_practice") }}</span>
        </el-menu-item>
        <el-menu-item index="/ListeningPractice" class="flex items-center gap-2">
          <img src="/images/listining.svg" class="w-5 h-5 shrink-0" />
          <span class="hidden md:inline">{{ t("dictation_practice") }}</span>
        </el-menu-item>
        <el-menu-item index="/SongOverview" class="flex items-center gap-2">
          <img src="/images/music.svg" class="w-5 h-5 shrink-0" />
          <span class="hidden md:inline">{{ t("song_practice") }}</span>
        </el-menu-item>
      </el-menu>
    </div>
    <div class="flex w-fit items-center gap-4 mr-4">
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
</script>

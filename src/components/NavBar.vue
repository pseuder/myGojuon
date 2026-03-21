<template>
  <nav class="flex w-full">
    <div class="user-select-none w-[50%] grow">
      <el-menu :default-active="activeIndex" mode="horizontal" router>
        <el-menu-item index="/">{{ t("home") }}</el-menu-item>
        <el-menu-item index="/WritingPractice">{{
          t("handwriting_practice")
        }}</el-menu-item>
        <el-menu-item index="/ListeningPractice">{{
          t("dictation_practice")
        }}</el-menu-item>
        <el-menu-item index="/SongOverview">{{
          t("song_practice")
        }}</el-menu-item>
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

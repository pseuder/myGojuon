<template>
  <div class="h-full">
    <nav class="navbar">
      <el-menu
        :default-active="activeIndex"
        class="w-full user-select-none overflow-hidden"
        mode="horizontal"
        router
      >
        <el-menu-item index="/">首頁</el-menu-item>
        <el-menu-item index="/writing">手寫練習</el-menu-item>
        <el-menu-item index="/listening">聽寫練習</el-menu-item>
        <el-menu-item index="/songOverview">歌曲總覽</el-menu-item>
        <el-menu-item index="/backend">
          <el-icon><Setting /></el-icon>
          <span>後台管理</span>
        </el-menu-item>
      </el-menu>
    </nav>

    <main class="content">
      <div class="main-component">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";
import { Setting } from "@element-plus/icons-vue";

const route = useRoute();
const activeIndex = ref("/");

watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath;
  },
  { immediate: true }
);
</script>

<style scoped>
.navbar {
  height: fit-content;
  position: relative;
  z-index: 2;
}

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
</style>

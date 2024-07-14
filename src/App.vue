<template>
  <div class="flex flex-col background-container">
    <header class="text-white">
      <div class="mx-auto">
        <el-menu
          :default-active="activeIndex"
          class="user-select-none overflow-hidden"
          mode="horizontal"
          router
        >
          <el-menu-item index="/">首頁</el-menu-item>
          <el-menu-item index="/writing">手寫練習</el-menu-item>
          <el-menu-item index="/listening">聽寫練習</el-menu-item>
        </el-menu>
      </div>
    </header>
    <main class="flex-grow container mx-auto main-container">
      <div class="main-component">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();
const activeIndex = ref("/");

// 监听路由变化，更新 activeIndex
watch(
  () => route.path,
  (newPath) => {
    activeIndex.value = newPath;
  },
  { immediate: true }
);
</script>

<style scoped>
.background-container {
  height: 100vh;
  position: relative;
  z-index: 1;
}

@media (hover: none) {
  .background-container {
    height: 90vh;
  }
}

.background-container::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: url("/images/gojuon-writing.jpg");
  background-size: cover;
  background-position: center;
  opacity: 0.5;
  z-index: -1;
}

.main-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.main-component {
  margin: auto;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.9);
  border-radius: 10px;
}
</style>

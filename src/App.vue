<template>
  <div class="flex flex-col background-container">
    <header class="text-white">
      <div class="mx-auto">
        <el-menu
          :default-active="activeIndex"
          class="user-select-none overflow-hidden"
          mode="horizontal"
          @select="handleSelect"
        >
          <el-menu-item index="home">首頁</el-menu-item>
          <el-menu-item index="learn">練習</el-menu-item>
        </el-menu>
      </div>
    </header>
    <main class="flex-grow container mx-auto main-container">
      <component
        class="main-component"
        :is="activeIndex === 'home' ? Home : Learn"
      />
    </main>
  </div>
</template>
<script setup>
import { ref } from "vue";
import Home from "@/views/Home.vue";
import Learn from "@/views/Learn.vue";

const activeIndex = ref("home");

const handleSelect = (index) => {
  activeIndex.value = index;
};
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
  opacity: 0.5; /* 調整這個值來改變透明度，範圍從0到1 */
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

<template>
  <div class="h-full flex flex-col px-4 py-4 gap-4">
    <div class="text-center py-10">
      <h1 class="text-4xl font-bold text-indigo-700">日語50音練習網站</h1>
      <p class="mt-2 text-xl text-gray-600">快速且提供即時書寫功能的功能</p>
    </div>

    <div>
      <!-- 特色區塊 -->
      <div class="grid md:grid-cols-3 gap-6 my-10">
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">50 音學習</h2>
          <p>全面學習日語常見音節</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">書寫友善</h2>
          <p>觸控筆友善的練習環境</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">隨機檢測</h2>
          <p>隨機挑選50音檢測熟悉程度</p>
        </div>
      </div>

      <!-- 開始學習按鈕 -->
      <div class="text-center my-10">
        <el-button @click="router.push('/writing')"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300">
          開始手寫練習
        </el-button>

        <el-button @click="router.push('/listening')"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300">
          開始聽寫練習
        </el-button>
      </div>

      <!-- 最近更新 -->
      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">最近更新</h2>
        <ul class="list-disc list-inside">
          <li>加入單字發音</li>
          <li>針對平板使用者做了優化</li>
          <li>新增聽寫練習</li>
          <li>加入AI自動辨識功能(實驗性)</li>
          <li>針對辨識功能逕行優化</li>
          <li>優化RWD效果</li>
          <li>2024-08-18新增歌曲練習</li>
          <li>2024-08-25歌曲練習新增漢字對照假名</li>
        </ul>
      </section>

      <span class="w-[98%] absolute bottom-0 text-end  z-10 text-sm text-gray-500">
        侵權通知: iop890520@gmail.com
      </span>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();
</script>

<style scoped>
.feature-card {
  @apply bg-white p-6 rounded-lg shadow-md text-center transition-all duration-300 ease-in-out;
}

.feature-card:hover {
  @apply scale-105;
}

.feature-card:hover h2 {
  @apply scale-110;
}

.feature-card:hover p {
  @apply scale-110;
}
</style>

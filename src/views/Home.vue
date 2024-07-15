<!-- pages/index.vue -->
<template>
  <div class="container w-[90vw] md:w-[80vw] mx-auto px-4">
    <header class="text-center py-10">
      <h1 class="text-4xl font-bold text-indigo-700">日語 50 音學習</h1>
      <p class="mt-2 text-xl text-gray-600">互動式日語假名學習平台</p>
    </header>

    <main>
      <!-- 特色區塊 -->
      <section class="grid md:grid-cols-3 gap-6 my-10">
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            平假名 & 片假名
          </h2>
          <p>全面學習日語兩大假名系統</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">互動練習</h2>
          <p>通過遊戲化練習鞏固學習</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">書寫友善</h2>
          <p>提供觸控筆使用者友善的練習環境</p>
        </div>
      </section>

      <!-- 開始學習按鈕 -->
      <div class="text-center my-10">
        <el-button
          @click="router.push('/writing')"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          開始手寫練習
        </el-button>

        <el-button
          @click="router.push('/listening')"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          開始聽寫練習
        </el-button>
      </div>

      <!-- 學習進度 -->
      <section v-if="isLoggedIn" class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">您的學習進度</h2>
        <!-- 這裡可以添加學習進度組件 -->
        <p>您已經掌握了 XX% 的假名</p>
      </section>

      <!-- 最近更新 -->
      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">最近更新</h2>
        <ul class="list-disc list-inside">
          <li>新增手寫練習</li>
          <li>新增聽寫練習</li>
          <li>加入自動辨識功能(實驗性)</li>
        </ul>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";

const router = useRouter();

const isLoggedIn = ref(true);
</script>

<style scoped>
.feature-card {
  @apply bg-white p-6 rounded-lg shadow-md text-center;
}
</style>

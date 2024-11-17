<template>
  <div class="h-full flex flex-col px-4 py-4 gap-4">
    <div class="text-center py-10">
      <h1 class="text-4xl font-bold text-indigo-700">日語50音學習網站</h1>
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
          <p>觸控筆友善的學習環境</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">隨機檢測</h2>
          <p>隨機挑選&AI辨識檢測熟悉程度</p>
        </div>
      </div>

      <!-- 開始學習按鈕 -->
      <div
        class="flex flex-col md:flex-row text-center my-10 gap-4 justify-center"
      >
        <el-button
          @click="router.push('/writing')"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          開始手寫練習
        </el-button>

        <el-button
          @click="router.push('/listening')"
          style="margin-left: 0px"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          開始聽寫練習
        </el-button>
        <el-button
          @click="router.push('/songOverview')"
          style="margin-left: 0px"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          開始歌曲練習
        </el-button>
      </div>

      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">登入</h2>
        <GoogleLogin />
      </section>

      <!-- 最近更新 -->
      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">最近更新</h2>
        <ul class="list-disc list-inside">
          <li>❤️あたらよ❤️あたらよ❤️あたらよ❤️</li>
          <li>加入單字發音</li>
          <li>針對平板使用者做了優化</li>
          <li>新增聽寫練習</li>
          <li>加入AI自動辨識功能(實驗性)</li>
          <li>針對辨識功能逕行優化</li>
          <li>優化RWD效果</li>
          <li>新增歌曲練習</li>
          <li>歌曲練習新增漢字對照假名</li>
          <li>避免使用平板時雙擊放大</li>
        </ul>
      </section>

      <!-- 聯絡方式 -->
      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">聯絡方式</h2>
        <ul class="list-disc list-inside">
          <div>信箱: iop890520@gmail.com</div>
        </ul>
      </section>

      <!-- Powered by -->
      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">Powered by</h2>
        <div class="flex flex-col gap-4">
          <a
            href="https://www.youtube.com/channel/UCgrtbLQsox2EYtF0iVclZjA"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span class="gradient-text-animated">あたらよ - Atarayo</span>
          </a>

          <div class="flex gap-2 items-center">
            <a
              href="https://vuejs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/vuejs.svg"
                alt="vuejs"
                class="w-10 h-10 text-red-400 hover:opacity-80 transition-opacity"
              />
            </a>

            <a
              href="https://element-plus.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <el-icon
                size="40"
                color="#409EFF"
                class="hover:opacity-80 transition-opacity"
              >
                <ElementPlus />
              </el-icon>
            </a>

            <a
              href="https://tailwindcss.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/tailwindcss.svg"
                alt="tailwindcss"
                class="w-10 h-10 hover:opacity-80 transition-opacity"
              />
            </a>

            <a
              href="https://www.google.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/Google.svg"
                alt="Google"
                class="w-10 h-10 hover:opacity-80 transition-opacity"
              />
            </a>

            <a
              href="https://www.youtube.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/YouTube.svg"
                alt="YouTube"
                class="w-10 h-10 hover:opacity-80 transition-opacity"
              />
            </a>

            <a
              href="https://vercel.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/vercel.svg"
                alt="vercel"
                class="w-10 h-10 hover:opacity-80 transition-opacity"
              />
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { ElementPlus } from "@element-plus/icons-vue";

import GoogleLogin from "@/components/GoogleLogin.vue";

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

.gradient-text-tech-animated {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 1.5rem;
  letter-spacing: 0.5px;
  animation: gradient-move 8s ease infinite;
}

.gradient-text-animated {
  background: linear-gradient(
    90deg,
    #ff6b6b,
    #4ecdc4,
    #45b7d1,
    #f8a5c2,
    #ff6b6b
  );
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 1.5rem;
  animation: gradient-animation 6s ease infinite;
}

@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}
</style>

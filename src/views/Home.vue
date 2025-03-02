<template>
  <div class="h-full flex flex-col px-4 py-4 gap-4">
    <div class="text-center py-10">
      <h1 class="text-4xl font-bold text-indigo-700">{{ t("site_title") }}</h1>
      <p class="mt-2 text-xl text-gray-600">{{ t("feature_description") }}</p>
    </div>

    <div>
      <!-- 特色區塊 -->
      <div class="grid md:grid-cols-3 gap-6 my-10">
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            {{ t("syllabary_learning") }}
          </h2>
          <p>{{ t("syllabary_description") }}</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            {{ t("writing_friendly") }}
          </h2>
          <p>{{ t("stylus_friendly") }}</p>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            {{ t("random_testing") }}
          </h2>
          <p>{{ t("random_selection_ai_assessment") }}</p>
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
          {{ t("start_handwriting_practice") }}
        </el-button>

        <el-button
          @click="router.push('/listening')"
          style="margin-left: 0px"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          {{ t("start_dictation_practice") }}
        </el-button>

        <el-button
          @click="router.push('/songOverview')"
          style="margin-left: 0px"
          class="bg-indigo-600 text-white px-6 py-6 rounded-lg text-xl hover:bg-indigo-700 transition duration-300"
        >
          {{ t("start_song_practice") }}
        </el-button>
      </div>

      <!-- Powered by -->
      <section class="my-10">
        <div class="flex flex-col gap-4">
          <h2 class="text-2xl font-bold text-indigo-700 mb-4">
            {{ t("song_promotion") }}
          </h2>

          <!-- あたらよ -->
          <router-link
            :to="{
              path: '/songOverview',
              query: { author: 'あたらよ' },
            }"
            class="text-lg text-blue-400 hover:underline hover:text-blue-600 block w-full mb-2 truncate"
          >
            <span class="gradient-text-animated">あたらよ - Atarayo</span>
          </router-link>

          <!-- 孤獨搖滾 -->
          <router-link
            :to="{
              path: '/songOverview',
              query: { author: '孤獨搖滾' },
            }"
            class="text-lg text-blue-400 hover:underline hover:text-blue-600 block w-full mb-2 truncate"
          >
            <span class="gradient-text-animated"
              >孤獨搖滾！ ぼっち・ざ・ろっく！</span
            >
          </router-link>

          <!-- Girls band Cry -->
          <router-link
            :to="{
              path: '/songOverview',
              query: { author: 'Girls Band Cry' },
            }"
            class="text-lg text-blue-400 hover:underline hover:text-blue-600 block w-full mb-2 truncate"
          >
            <span class="gradient-text-animated"
              >Girls band Cry ガールズバンドクライ</span
            >
          </router-link>

          <!-- Mygo -->
          <router-link
            :to="{
              path: '/songOverview',
              query: { author: 'MYGO!!!!!' },
            }"
            class="text-lg text-blue-400 hover:underline hover:text-blue-600 block w-full mb-2 truncate"
          >
            <span class="gradient-text-animated"
              >BanG Dream! It's MyGO!!!!!</span
            >
          </router-link>

          <h2 class="text-2xl font-bold text-indigo-700 mb-4">Powered by</h2>

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

      <!-- 聯絡方式 -->
      <section class="my-10">
        <h2 class="text-2xl font-bold text-indigo-700 mb-4">
          {{ t("feedback_and_feature_request") }}
        </h2>

        <!-- gmail -->
        <div class="flex flex-col gap-4 my-4">
          <div class="flex items-center gap-4">
            <img
              src="/images/gmail.png"
              alt="gmail"
              class="w-8 h-8 text-red-400 hover:opacity-80 transition-opacity"
            />
            <a
              href="mailto:iop890520@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>iop890520@gmail.com</span>
            </a>
          </div>
        </div>

        <!-- fb -->
        <div class="flex flex-col gap-4 my-4">
          <div class="flex items-center gap-4">
            <img
              src="/images/facebook.png"
              alt="facebook"
              class="w-8 h-8 text-red-400 hover:opacity-80 transition-opacity"
            />
            <a
              href="https://www.facebook.com/Pseuder/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span>https://www.facebook.com/Pseuder/</span>
            </a>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElementPlus } from "@element-plus/icons-vue";

const router = useRouter();

import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

const updateMeta = () => {
  document.title = t("meta.title");
  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", t("meta.description"));
  document
    .querySelector('meta[name="keywords"]')
    .setAttribute("content", t("meta.keywords"));
};

onMounted(updateMeta);
watch(locale, updateMeta);
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

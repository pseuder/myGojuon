<template>
  <div class="flex h-full flex-col gap-4 px-4 py-4">
    <div class="py-10 text-center">
      <h1 class="text-3xl font-bold text-indigo-700 md:text-4xl">
        <img src="/favicon.png" alt="Logo" class="mr-2 inline-block h-10" />{{
          t("site_title")
        }}
      </h1>
      <p class="mt-2 text-xl text-gray-600">{{ t("feature_description") }}</p>
    </div>

    <div>
      <div class="my-10 grid gap-6 md:grid-cols-3">
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            {{ t("syllabary_learning") }}
          </h2>
          <pre>{{ t("syllabary_description") }}</pre>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            {{ t("writing_friendly") }}
          </h2>
          <pre>{{ t("stylus_friendly") }}</pre>
        </div>
        <div class="feature-card">
          <h2 class="text-2xl font-semibold text-indigo-600">
            {{ t("random_testing") }}
          </h2>
          <pre>{{ t("random_selection_ai_assessment") }}</pre>
        </div>
      </div>

      <div
        class="my-10 flex flex-col justify-center gap-4 text-center md:flex-row"
      >
        <el-button
          @click="router.push('/WritingPractice')"
          class="rounded-lg bg-indigo-600 px-6 py-6 text-xl text-white transition duration-300 hover:bg-indigo-700"
        >
          {{ t("start_handwriting_practice") }}
        </el-button>
        <el-button
          @click="router.push('/ListeningPractice')"
          style="margin-left: 0px"
          class="rounded-lg bg-indigo-600 px-6 py-6 text-xl text-white transition duration-300 hover:bg-indigo-700"
        >
          {{ t("start_dictation_practice") }}
        </el-button>
        <el-button
          @click="router.push('/SongOverview')"
          style="margin-left: 0px"
          class="rounded-lg bg-indigo-600 px-6 py-6 text-xl text-white transition duration-300 hover:bg-indigo-700"
        >
          {{ t("start_song_practice") }}
        </el-button>
      </div>

      <section class="my-10 flex flex-col">
        <h2 class="mb-4 text-2xl font-bold text-indigo-700">
          {{ t("contact_me") }}
        </h2>
        <div class="flex flex-col gap-2">
          <div class="my-4 flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <a
                href="mailto:iop890520@gmail.com"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/images/gmail.png"
                  :alt="t('contact_me') + ' - Gmail'"
                  class="h-8 w-8 text-red-400 transition-opacity hover:opacity-80"
                />
              </a>
              <span>iop890520@gmail.com</span>
            </div>
          </div>
          <div class="my-4 flex flex-col gap-4">
            <div class="flex items-center gap-4">
              <a
                href="https://www.facebook.com/Pseuder/"
                target="_blank"
                rel="noopener noreferrer"
              >
                <img
                  src="/images/facebook.png"
                  :alt="t('contact_me') + ' - Facebook'"
                  class="h-8 w-8 text-red-400 transition-opacity hover:opacity-80"
                />
              </a>
              <span>https://www.facebook.com/Pseuder</span>
            </div>
          </div>
        </div>
      </section>

      <section class="my-10">
        <div class="flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold text-indigo-700">Powered by</h2>
          <div class="flex items-center gap-2">
            <a
              href="https://vuejs.org/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/vuejs.svg"
                alt="Vue.js"
                class="h-10 w-10 transition-opacity hover:opacity-80"
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
                class="transition-opacity hover:opacity-80"
                ><ElementPlus
              /></el-icon>
            </a>
            <a
              href="https://tailwindcss.com/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <img
                src="/images/tailwindcss.svg"
                alt="Tailwind CSS"
                class="h-10 w-10 transition-opacity hover:opacity-80"
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
                class="h-10 w-10 transition-opacity hover:opacity-80"
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
                class="h-10 w-10 transition-opacity hover:opacity-80"
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
                class="h-10 w-10 transition-opacity hover:opacity-80"
              />
            </a>
            <el-button
              :icon="VideoCameraFilled"
              circle
              @click="router.push('/S/empty')"
            />
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from "vue-router";
import { ElementPlus, VideoCameraFilled } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

const router = useRouter();
const { t } = useI18n();
</script>

<style scoped>
@reference "tailwindcss";
.feature-card {
  @apply rounded-lg bg-white p-6 text-center shadow-md transition-all duration-300 ease-in-out;
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
pre {
  white-space: pre-wrap;
  word-wrap: break-word;
  overflow-wrap: break-word;
}
</style>

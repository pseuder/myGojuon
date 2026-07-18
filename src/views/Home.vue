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
            <div
              class="flex items-center gap-4"
              @click="handleContactClick('gmail')"
            >
              <img
                src="/images/gmail.png"
                :alt="t('contact_me') + ' - Gmail'"
                class="h-8 w-8 text-red-400 transition-opacity hover:opacity-80"
              />
              <span>mygojuon@gmail.com</span>
            </div>
          </div>
          <div class="my-4 flex flex-col gap-4">
            <div
              class="flex items-center gap-4"
              @click="handleContactClick('facebook')"
            >
              <img
                src="/images/facebook.png"
                :alt="t('contact_me') + ' - Facebook'"
                class="h-8 w-8 text-red-400 transition-opacity hover:opacity-80"
              />
              <a
                href="https://www.facebook.com/Pseuder/"
                target="_blank"
                rel="noopener noreferrer"
                class="text-blue-700 underline"
              >
                https://www.facebook.com/Pseuder
              </a>
            </div>
          </div>
        </div>
      </section>

      <section class="my-10">
        <div class="flex flex-col gap-4">
          <h2 class="mb-4 text-2xl font-bold text-indigo-700">此網站謹獻給</h2>
          <div class="flex flex-col gap-2">
            <!-- LiSA -->
            <div class="my-4 flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <img
                  src="/images/LiSA.png"
                  :alt="t('contact_me') + ' - Gmail'"
                  class="h-18 w-18 rounded-full object-cover"
                />
                <div class="flex flex-col">
                  <h3
                    class="gradient-text-tech-animated cursor-pointer text-2xl"
                    @click="router.push('/SongOverview?artist=25')"
                  >
                    LiSA
                  </h3>
                  <div>
                    2024/11/30 & 2024/12/01 - LiSA LiVE is Smile Always~COCKTAiL
                    PARTY [SWEET & SOUR] 国立代々木競技場
                  </div>
                </div>
              </div>
            </div>

            <!-- 孤獨搖滾 -->
            <div class="my-4 flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <img
                  src="/images/bochi.png"
                  :alt="t('contact_me') + ' - Gmail'"
                  class="h-18 w-18 rounded-full object-cover"
                />
                <div class="flex flex-col">
                  <h3
                    class="gradient-text-tech-animated cursor-pointer text-2xl"
                    @click="router.push('/SongOverview?artist=1')"
                  >
                    孤獨搖滾
                  </h3>
                  <div
                    @click="router.push('/SongPractice/B7BxrAAXl94')"
                    class="text-blue-700 underline"
                  >
                    ギターと孤独と蒼い惑星 - 結束バンド
                  </div>
                </div>
              </div>
            </div>

            <!-- あたらよ -->
            <div class="my-4 flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <img
                  src="/images/あたらよ.png"
                  :alt="t('contact_me') + ' - Gmail'"
                  class="h-18 w-18 rounded-full object-cover"
                />
                <div class="flex flex-col">
                  <h3
                    class="gradient-text-tech-animated cursor-pointer text-2xl"
                    @click="router.push('/SongOverview?artist=2')"
                  >
                    あたらよ
                  </h3>
                  <div
                    @click="router.push('/SongPractice/Y2wZKacNue8')"
                    class="text-blue-700 underline"
                  >
                    outcry - あたらよ
                  </div>
                </div>
              </div>
            </div>

            <!-- あたらよ -->
            <div class="my-4 flex flex-col gap-4">
              <div class="flex items-center gap-4">
                <img
                  src="/images/ヨルシカ.png"
                  :alt="t('contact_me') + ' - Gmail'"
                  class="h-18 w-18 rounded-full object-cover"
                />
                <div class="flex flex-col">
                  <h3
                    class="gradient-text-tech-animated cursor-pointer text-2xl"
                    @click="router.push('/SongOverview?artist=45')"
                  >
                    ヨルシカ
                  </h3>
                  <div
                    @click="router.push('/SongPractice/-VKIqrvVOpo')"
                    class="text-blue-700 underline"
                  >
                    ただ君に晴れ - ヨルシカ
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2 text-gray-700 italic">
            ©{{ t("site_title") }}
            2024 - 2026
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
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useRouter } from "vue-router";
import { ElementPlus, VideoCameraFilled } from "@element-plus/icons-vue";
import { useI18n } from "vue-i18n";

/*-- API --*/
import { useApi } from "@/composables/useApi.js";
const MYAPI = useApi();

/*-- router --*/
const router = useRouter();
const { t } = useI18n();

const handleContactClick = async (contactType) => {
  try {
    const params = {
      contactType: contactType,
    };
    await MYAPI.post("/contact", params);
  } catch (err) {
    console.error(err);
  }
};

onMounted(() => {
  document.title = `${t("meta.title")}`;

  document
    .querySelector('meta[name="description"]')
    .setAttribute("content", `${t("meta.description")}`);

  document
    .querySelector('meta[property="og:title"]')
    .setAttribute(
      "content",
      `${t("handwriting_practice")} | ${t("meta.title")}`,
    );
  document
    .querySelector('meta[property="og:description"]')
    .setAttribute("content", `${t("meta.description")}`);
  document
    .querySelector('meta[property="og:url"]')
    .setAttribute("content", window.location.href);
});
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

.gradient-text-tech-animated {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 0.5px;
  animation: gradient-animation 8s ease infinite;
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

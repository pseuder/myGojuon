<template>
  <!-- 設定頁：選出題方式與學習集；按「開始」後到 /VocabStudy/session 練習 -->
  <div class="flex h-full flex-col gap-4 overflow-y-auto px-2 py-4 md:px-4">
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <!-- <h1 class="text-2xl font-bold text-indigo-700">
        {{ t("vocab.study_title") }}
      </h1> -->
      <el-button
        :icon="House"
        @click="router.push('/VocabSets')"
        type="primary"
        plain
      >
        {{ t("vocab.back_to_list") }}
      </el-button>
      <!-- 開始鍵放在右上方 -->
      <el-button
        v-if="authStore.isLoggedIn"
        type="success"
        :icon="VideoPlay"
        :loading="starting"
        :disabled="!selectedIds.length"
        @click="handleStart"
      >
        {{ t("vocab.start") }}
      </el-button>
    </div>

    <div
      v-if="!authStore.isLoggedIn"
      class="py-20 text-center text-lg text-gray-400"
    >
      {{ t("vocab.login_required") }}
    </div>

    <div
      v-else
      v-loading="vocabStore.isFetching"
      class="flex min-h-0 min-w-0 flex-1 flex-col gap-4"
    >
      <!-- 出題方式：固定高度，在學習集清單上方 -->
      <div class="flex shrink-0 flex-col gap-3 border-b border-gray-200 pb-3">
        <section class="flex flex-col gap-2">
          <!-- <h2 class="text-lg font-bold">{{ t("vocab.choose_mode") }}</h2> -->
          <el-radio-group
            v-model="mode"
            class="mode-group flex flex-wrap items-center gap-x-6 gap-y-2"
          >
            <el-radio value="all">
              {{ t("vocab.mode_all") }}
              <span class="text-gray-500"
                >（{{ selectedWordCount }} {{ t("vocab.words") }}）</span
              >
            </el-radio>
            <el-radio value="random">
              <span class="flex flex-wrap items-center gap-2">
                {{ t("vocab.mode_random") }}
                <el-input-number
                  v-model="randomCount"
                  :min="1"
                  :max="500"
                  size="small"
                  @focus="mode = 'random'"
                />
                {{ t("vocab.questions") }}
              </span>
            </el-radio>
            <el-radio value="unfamiliar">
              <span class="flex flex-wrap items-center gap-2">
                {{ t("vocab.mode_unfamiliar") }}
                <el-input-number
                  v-model="minUnfamiliar"
                  :min="1"
                  :max="999"
                  size="small"
                  @focus="mode = 'unfamiliar'"
                />
                {{ t("vocab.times_or_more") }}
              </span>
            </el-radio>
          </el-radio-group>
        </section>

        <section
          class="commute-row flex flex-wrap items-center gap-x-4 gap-y-2"
        >
          <el-checkbox v-model="commuteMode">
            {{ t("vocab.commute_mode") }}
          </el-checkbox>
          <span
            class="flex items-center gap-2"
            :class="{ 'opacity-50': !commuteMode }"
          >
            {{ t("vocab.front") }}
            <el-input-number
              v-model="frontTimes"
              :min="0"
              :max="10"
              size="small"
              @focus="commuteMode = true"
            />
            {{ t("vocab.times") }}
          </span>
          <span
            class="flex items-center gap-2"
            :class="{ 'opacity-50': !commuteMode }"
          >
            {{ t("vocab.back") }}
            <el-input-number
              v-model="backTimes"
              :min="0"
              :max="10"
              size="small"
              @focus="commuteMode = true"
            />
            {{ t("vocab.times") }}
          </span>
        </section>
      </div>

      <!-- 學習集占用剩下的高度，清單在區塊內捲動 -->
      <section class="flex min-h-[160px] flex-1 flex-col gap-2">
        <div class="flex shrink-0 items-center justify-between">
          <h2 class="text-lg font-bold">{{ t("vocab.choose_sets") }}</h2>
          <el-checkbox
            :model-value="allSelected"
            :indeterminate="selectedIds.length > 0 && !allSelected"
            @change="toggleAll"
          >
            {{ t("vocab.select_all") }}
          </el-checkbox>
        </div>
        <!-- grid-cols-1 = minmax(0, 1fr)：長標題才會截斷，而不是把欄位撐寬 -->
        <div
          class="grid min-h-0 flex-1 grid-cols-1 content-start gap-2 overflow-y-auto pr-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4"
        >
          <div
            v-for="set in vocabStore.sets"
            :key="set.vocab_set_id"
            class="flex min-w-0 cursor-pointer items-center gap-3 rounded-lg border p-3 transition"
            :class="
              selectedIds.includes(set.vocab_set_id)
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-200'
            "
            @click="toggleSet(set.vocab_set_id)"
          >
            <!-- 只做顯示，點擊交給外層 -->
            <el-checkbox
              class="pointer-events-none"
              :model-value="selectedIds.includes(set.vocab_set_id)"
            />
            <div class="flex min-w-0 flex-1 flex-col">
              <span class="truncate font-bold">{{ set.title }}</span>
              <span class="text-xs text-gray-500">
                {{ set.word_count }} {{ t("vocab.words") }}
                <template v-if="set.unfamiliar_count">
                  ・<span class="text-red-500"
                    >{{ t("vocab.unfamiliar") }}
                    {{ set.unfamiliar_count }}</span
                  >
                </template>
              </span>
            </div>
            <!-- 查看單字集內容；stop 避免同時切換勾選 -->
            <el-button
              class="shrink-0"
              circle
              size="small"
              :icon="View"
              :title="t('vocab.view_detail')"
              @click.stop="openDetail(set.vocab_set_id)"
            />
          </div>
        </div>
        <p
          v-if="vocabStore.isInitialized && !vocabStore.sets.length"
          class="text-gray-400"
        >
          {{ t("vocab.no_sets") }}
        </p>
      </section>
    </div>

    <VocabSetDetailDialog v-model="detailVisible" :set-id="detailId">
      <template #footer="{ detail }">
        <el-button
          :type="
            selectedIds.includes(detail.vocab_set_id) ? 'default' : 'success'
          "
          @click="
            toggleSet(detail.vocab_set_id);
            detailVisible = false;
          "
        >
          {{
            selectedIds.includes(detail.vocab_set_id)
              ? t("vocab.unselect_set")
              : t("vocab.select_set")
          }}
        </el-button>
      </template>
    </VocabSetDetailDialog>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import { VideoPlay, House, View } from "@element-plus/icons-vue";
import VocabSetDetailDialog from "@/components/vocab/VocabSetDetailDialog.vue";
import { useAuthStore, useVocabStore } from "@/stores/index.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";
import {
  AUTO_PLAY_KEY,
  COMMUTE_KEY,
  FRONT_TIMES_KEY,
  BACK_TIMES_KEY,
  readFlag,
  saveFlag,
  readNumber,
  saveNumber,
  studyOwner,
  saveStudySession,
} from "@/utils/vocabStudyStorage.js";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const vocabStore = useVocabStore();
// 只用來在點擊當下啟用音訊（AudioContext 全站共用，到練習頁仍有效）
const { unlock } = useGoogleTTS("ja");

// --- 設定 ---
const selectedIds = ref([]);
const mode = ref("all");
const randomCount = ref(20);
const minUnfamiliar = ref(1);
const starting = ref(false);

const allSelected = computed(
  () =>
    vocabStore.sets.length > 0 &&
    selectedIds.value.length === vocabStore.sets.length,
);
const selectedWordCount = computed(() =>
  vocabStore.sets
    .filter((s) => selectedIds.value.includes(s.vocab_set_id))
    .reduce((sum, s) => sum + Number(s.word_count), 0),
);

const toggleSet = (id) => {
  const i = selectedIds.value.indexOf(id);
  if (i === -1) selectedIds.value.push(id);
  else selectedIds.value.splice(i, 1);
};
const toggleAll = () => {
  selectedIds.value = allSelected.value
    ? []
    : vocabStore.sets.map((s) => s.vocab_set_id);
};

// --- 單字集詳細 ---
const detailVisible = ref(false);
const detailId = ref(null);
const openDetail = (id) => {
  detailId.value = id;
  detailVisible.value = true;
};

// --- 練習偏好（練習頁讀同一組 localStorage 設定）---
const autoPlay = readFlag(AUTO_PLAY_KEY, false);
// 通勤模式：正面念 N 次 → 翻面念 M 次 → 自動下一張
const commuteMode = ref(readFlag(COMMUTE_KEY, false));
const frontTimes = ref(readNumber(FRONT_TIMES_KEY, 1));
const backTimes = ref(readNumber(BACK_TIMES_KEY, 1));
watch(commuteMode, (v) => saveFlag(COMMUTE_KEY, v));
watch(frontTimes, (v) => saveNumber(FRONT_TIMES_KEY, v ?? 0));
watch(backTimes, (v) => saveNumber(BACK_TIMES_KEY, v ?? 0));

const handleStart = async () => {
  // 取題目要等 API，先在點擊當下啟用音訊，第一張的自動播放才不會被瀏覽器擋下
  if (autoPlay || commuteMode.value) unlock();
  starting.value = true;
  try {
    const words = await vocabStore.getStudyWords({
      set_ids: selectedIds.value,
      mode: mode.value,
      count: mode.value === "random" ? randomCount.value : 0,
      min_unfamiliar: minUnfamiliar.value,
    });
    if (!words.length) {
      ElMessage.warning(t("vocab.no_matching_words"));
      return;
    }
    // 題目先存進 localStorage，練習頁從那裡接手；started=false 代表還沒開局
    saveStudySession({
      owner: studyOwner(authStore.user),
      started: false,
      phase: "study",
      cards: words,
      index: 0,
      results: [],
      committed: 0,
      round: 0,
    });
    const prefix = route.path.startsWith("/en/") ? "/en" : "";
    router.push(`${prefix}/VocabStudy/session`);
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    starting.value = false;
  }
};

// --- 初始化 ---
const init = async () => {
  if (!authStore.isLoggedIn) return;
  try {
    if (!vocabStore.isInitialized) await vocabStore.fetchSets();
  } catch (err) {
    ElMessage.error(err.message);
    return;
  }
  // ?sets=1,2 預先勾選
  const preset = String(route.query.sets || "")
    .split(",")
    .map(Number)
    .filter((id) => vocabStore.sets.some((s) => s.vocab_set_id === id));
  if (preset.length) selectedIds.value = preset;
};

watch(() => authStore.isLoggedIn, init);

onMounted(() => {
  document.title = `${t("vocab.study_title")} - ${t("site_title")}`;
  init();
});
</script>

<style scoped>
.mode-group :deep(.el-radio) {
  height: auto;
  min-height: 32px;
  max-width: 100%;
  margin-right: 0;
}
/* el-radio / el-checkbox 預設不換行，窄螢幕會撐出畫面 */
.mode-group :deep(.el-radio__label),
.commute-row :deep(.el-checkbox__label) {
  white-space: normal;
}
</style>

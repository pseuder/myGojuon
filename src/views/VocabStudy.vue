<template>
  <div class="flex h-full flex-col gap-4 px-2 py-4 md:px-4">
    <div class="flex flex-wrap items-center justify-between gap-2">
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
    </div>

    <div
      v-if="!authStore.isLoggedIn"
      class="py-20 text-center text-lg text-gray-400"
    >
      {{ t("vocab.login_required") }}
    </div>

    <!-- ===== 1. 設定 ===== -->
    <div
      v-else-if="phase === 'setup'"
      v-loading="vocabStore.isFetching"
      class="flex flex-col gap-5"
    >
      <section class="flex flex-col gap-2">
        <div class="flex items-center justify-between">
          <h2 class="text-lg font-bold">{{ t("vocab.choose_sets") }}</h2>
          <el-checkbox
            :model-value="allSelected"
            :indeterminate="selectedIds.length > 0 && !allSelected"
            @change="toggleAll"
          >
            {{ t("vocab.select_all") }}
          </el-checkbox>
        </div>
        <div class="grid gap-2 sm:grid-cols-2">
          <div
            v-for="set in vocabStore.sets"
            :key="set.vocab_set_id"
            class="flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition"
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
          </div>
        </div>
        <p
          v-if="vocabStore.isInitialized && !vocabStore.sets.length"
          class="text-gray-400"
        >
          {{ t("vocab.no_sets") }}
        </p>
      </section>

      <section class="flex flex-col gap-2">
        <h2 class="text-lg font-bold">{{ t("vocab.choose_mode") }}</h2>
        <el-radio-group
          v-model="mode"
          class="mode-group flex flex-col items-start gap-2"
        >
          <el-radio value="all">
            {{ t("vocab.mode_all") }}
            <span class="text-gray-500"
              >（{{ selectedWordCount }} {{ t("vocab.words") }}）</span
            >
          </el-radio>
          <el-radio value="random">
            <span class="flex items-center gap-2">
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
            <span class="flex items-center gap-2">
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

      <div class="flex justify-center">
        <el-button
          type="success"
          size="large"
          :icon="VideoPlay"
          :loading="starting"
          :disabled="!selectedIds.length"
          @click="handleStart"
        >
          {{ t("vocab.start") }}
        </el-button>
      </div>
    </div>

    <!-- ===== 2. 卡片練習 ===== -->
    <div
      v-else-if="phase === 'study' && current"
      class="flex flex-col items-center gap-4"
    >
      <div class="flex w-full max-w-xl flex-col gap-2">
        <div class="flex items-center justify-between gap-2">
          <div class="flex items-center gap-2">
            <span class="font-bold text-gray-600"
              >{{ index + 1 }} / {{ cards.length }}</span
            >
            <el-button
              size="small"
              :icon="Back"
              :disabled="!canGoBack"
              @click="goBack"
              type="info"
              plain
            >
              {{ t("vocab.prev_word") }}
            </el-button>
          </div>
          <div class="flex flex-wrap items-center justify-end gap-3">
            <el-switch v-model="autoPlay" :active-text="t('vocab.auto_play')" />
            <el-switch v-model="showKana" :active-text="t('vocab.show_kana')" />
            <el-button size="small" @click="finish" type="danger" plain>{{
              t("vocab.end")
            }}</el-button>
          </div>
        </div>
        <el-progress
          :percentage="Math.round((index / cards.length) * 100)"
          :show-text="false"
        />
      </div>

      <!-- key 綁定題目：換題時重新建立，不會看到上一張的翻轉動畫 -->
      <div
        :key="`${round}-${index}`"
        class="flip-card w-full max-w-xl"
        @click="flip"
      >
        <div class="flip-inner" :class="{ flipped }">
          <!-- 正面 -->
          <div class="flip-face front">
            <span
              class="absolute top-3 left-4 max-w-[70%] truncate text-xs text-gray-400"
            >
              {{ current.set_title }}
            </span>
            <button
              type="button"
              class="absolute top-2 right-2 rounded-full p-2 hover:bg-indigo-100"
              :title="t('tools.speak')"
              @click.stop="speakCurrent"
            >
              <img
                :src="
                  speakingKey === current.vocab_word_id
                    ? '/images/volume2.png'
                    : '/images/volume.png'
                "
                alt=""
                class="h-8 w-8"
              />
            </button>
            <RubyWord
              :word="current.word"
              :tokens="current.tokens"
              :show-kana="showKana"
              class="card-word px-4 text-center"
            />
            <span class="absolute bottom-3 text-xs text-gray-400">{{
              t("vocab.tap_to_flip")
            }}</span>
          </div>
          <!-- 背面 -->
          <div class="flip-face back">
            <span
              class="px-6 text-center text-3xl font-bold whitespace-pre-wrap text-teal-800 md:text-4xl"
            >
              {{ current.meaning }}
            </span>
            <!-- 背面一律顯示假名，不受「顯示假名」開關影響 -->
            <RubyWord
              :word="current.word"
              :tokens="current.tokens"
              class="mt-4 px-4 text-center text-3xl font-bold text-gray-700"
            />
            <span
              v-if="(!hasRuby && current.kana) || current.romaji"
              class="text-lg text-gray-500"
            >
              <template v-if="!hasRuby && current.kana">{{
                current.kana
              }}</template>
              <template v-if="!hasRuby && current.kana && current.romaji">
                ・
              </template>
              {{ current.romaji }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid w-full max-w-xl grid-cols-2 gap-3">
        <el-button
          class="answer-btn"
          type="warning"
          size="large"
          :plain="currentAnswer === true"
          @click="answer(false)"
        >
          <el-icon class="mr-1"><CloseBold /></el-icon
          >{{ t("vocab.unfamiliar") }}
        </el-button>
        <el-button
          class="answer-btn"
          type="success"
          size="large"
          style="margin-left: 0"
          :plain="currentAnswer === false"
          @click="answer(true)"
        >
          <el-icon class="mr-1"><Select /></el-icon>{{ t("vocab.familiar") }}
        </el-button>
      </div>
      <p class="hidden text-xs text-gray-400 md:block">
        {{ t("vocab.keyboard_hint") }}
      </p>
    </div>

    <!-- ===== 3. 結果 ===== -->
    <div
      v-else-if="phase === 'result'"
      class="flex flex-col items-center gap-4"
    >
      <h2 class="text-xl font-bold">{{ t("vocab.result_title") }}</h2>
      <div class="flex gap-8 text-center">
        <div>
          <div class="text-4xl font-bold text-emerald-600">
            {{ familiarResults.length }}
          </div>
          <div class="text-gray-500">{{ t("vocab.familiar") }}</div>
        </div>
        <div>
          <div class="text-4xl font-bold text-red-500">
            {{ unfamiliarResults.length }}
          </div>
          <div class="text-gray-500">{{ t("vocab.unfamiliar") }}</div>
        </div>
      </div>

      <div
        v-if="unfamiliarResults.length"
        class="w-full max-w-xl rounded-lg border border-red-100"
      >
        <div
          v-for="w in unfamiliarResults"
          :key="w.vocab_word_id"
          class="flex items-center gap-3 border-b border-red-50 px-3 py-1 last:border-b-0"
        >
          <RubyWord
            :word="w.word"
            :tokens="w.tokens"
            class="min-w-24 text-xl"
          />
          <span class="flex-1 text-gray-700">{{ w.meaning }}</span>
        </div>
      </div>

      <div class="flex flex-wrap justify-center gap-2">
        <el-button
          v-if="unfamiliarResults.length"
          type="danger"
          @click="restart(unfamiliarResults)"
        >
          {{ t("vocab.retry_unfamiliar") }}
        </el-button>
        <el-button type="primary" @click="restart(cards)">{{
          t("vocab.retry_all")
        }}</el-button>
        <el-button @click="phase = 'setup'">{{
          t("vocab.reselect")
        }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import {
  Back,
  VideoPlay,
  CloseBold,
  Select,
  RefreshLeft,
  House,
} from "@element-plus/icons-vue";
import { useAuthStore, useVocabStore } from "@/stores/index.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";
import RubyWord from "@/components/vocab/RubyWord.vue";

const SHOW_KANA_KEY = "vocab_show_kana";
const AUTO_PLAY_KEY = "vocab_auto_play";

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const vocabStore = useVocabStore();
const { speak, speakingKey, stop, unlock } = useGoogleTTS("ja");

// --- 設定 ---
const phase = ref("setup");
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

// --- 練習 ---
const cards = ref([]);
const index = ref(0);
const flipped = ref(false);
const round = ref(0);
// 依題目位置存放：退回上一題重答時直接覆蓋
const results = ref([]); // [{ ...card, is_familiar }]
// 後端每次作答都會累加次數，所以先暫存、結束時才送出；已送出的題目不能再退回
const committed = ref(0);

const readFlag = (key, fallback) => {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : v !== "0";
  } catch {
    return fallback;
  }
};
const saveFlag = (key, v) => {
  try {
    localStorage.setItem(key, v ? "1" : "0");
  } catch {
    /* 無法使用 localStorage 時只在本次有效 */
  }
};

const showKana = ref(readFlag(SHOW_KANA_KEY, true));
watch(showKana, (v) => saveFlag(SHOW_KANA_KEY, v));

const current = computed(() => cards.value[index.value]);

// 與 RubyWord 相同的判斷：tokens 對得上原文且有注音才算有假名標註，否則背面另外列出假名
const hasRuby = computed(() => {
  const tokens = current.value?.tokens || [];
  return (
    tokens.some((tk) => tk.cvt) &&
    tokens.map((tk) => tk.ori).join("") === current.value.word
  );
});

const speakCurrent = () => {
  const card = current.value;
  if (card) speak(card.kana || card.word, card.vocab_word_id);
};

// 自動播放：換到下一個單字時念出發音；剛打開開關時念目前這張
const autoPlay = ref(readFlag(AUTO_PLAY_KEY, false));
watch(autoPlay, (v) => {
  saveFlag(AUTO_PLAY_KEY, v);
  if (v && phase.value === "study" && speakingKey.value === null)
    speakCurrent();
});
watch([round, index], () => {
  if (autoPlay.value && phase.value === "study") speakCurrent();
});

// 翻到背面一律念；翻回正面只在自動發音時念
// 先停掉正在播的，避免 speak 把同一張當成「再點一次=停止」
const flip = () => {
  flipped.value = !flipped.value;
  if (flipped.value || autoPlay.value) {
    stop();
    speakCurrent();
  }
};
const familiarResults = computed(() =>
  results.value.filter((r) => r?.is_familiar),
);
const unfamiliarResults = computed(() =>
  results.value.filter((r) => r && !r.is_familiar),
);
// 退回時標示這題之前選了什麼
const currentAnswer = computed(() => results.value[index.value]?.is_familiar);
const canGoBack = computed(() => index.value > committed.value);

const shuffle = (list) => {
  const arr = [...list];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const beginRound = (list) => {
  cards.value = list;
  index.value = 0;
  flipped.value = false;
  results.value = [];
  committed.value = 0;
  round.value += 1;
  phase.value = "study";
};

const handleStart = async () => {
  // 取題目要等 API，先在點擊當下啟用音訊，第一張的自動播放才不會被瀏覽器擋下
  if (autoPlay.value) unlock();
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
    beginRound(words);
  } catch (err) {
    ElMessage.error(err.message);
  } finally {
    starting.value = false;
  }
};

let recordErrorShown = false;
// 送出尚未記錄的作答；記錄不阻塞畫面
const flushRecords = () => {
  const pending = results.value.slice(committed.value).filter(Boolean);
  committed.value = results.value.length;
  pending.forEach((r) =>
    vocabStore.recordAnswer(r.vocab_word_id, r.is_familiar).catch((err) => {
      console.error(err);
      if (!recordErrorShown) {
        recordErrorShown = true;
        ElMessage.warning(t("vocab.record_failed"));
      }
    }),
  );
};

const answer = (isFamiliar) => {
  const card = current.value;
  if (!card) return;
  results.value[index.value] = { ...card, is_familiar: isFamiliar };
  stop();
  // 避免按鈕保留焦點，之後按空白/Enter 又觸發一次作答
  document.activeElement?.blur?.();
  if (index.value + 1 >= cards.value.length) {
    finish();
  } else {
    flipped.value = false;
    index.value += 1;
  }
};

const goBack = () => {
  if (!canGoBack.value) return;
  stop();
  document.activeElement?.blur?.();
  flipped.value = false;
  index.value -= 1;
};

const finish = () => {
  stop();
  flushRecords();
  phase.value = "result";
};

// 切到背景（關分頁、手機切 App）時先送出，避免作答遺失
const onVisibilityChange = () => {
  if (document.visibilityState === "hidden" && phase.value === "study")
    flushRecords();
};

const restart = (list) =>
  beginRound(shuffle(list.map(({ is_familiar, ...card }) => card)));

// 鍵盤：空白/Enter 翻面，← 不熟悉，→ 熟悉，Backspace/↑ 上一個
const onKeydown = (e) => {
  if (phase.value !== "study") return;
  const tag = e.target?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return;
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    flip();
  } else if (e.key === "ArrowLeft") {
    answer(false);
  } else if (e.key === "ArrowRight") {
    answer(true);
  } else if (e.key === "Backspace" || e.key === "ArrowUp") {
    e.preventDefault();
    goBack();
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
  window.addEventListener("keydown", onKeydown);
  document.addEventListener("visibilitychange", onVisibilityChange);
  init();
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  // 練習到一半離開頁面，已作答的仍要記錄
  flushRecords();
});
</script>

<style scoped>
.flip-card {
  height: 340px;
  perspective: 1200px;
  cursor: pointer;
  user-select: none;
}
.flip-inner {
  position: relative;
  width: 100%;
  height: 100%;
  transition: transform 0.45s;
  transform-style: preserve-3d;
}
.flip-inner.flipped {
  transform: rotateY(180deg);
}
.flip-face {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.12);
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
.front {
  background: linear-gradient(135deg, #eef2ff, #ffffff);
}
.back {
  background: linear-gradient(135deg, #d1fae5, #ccfbf1);
  transform: rotateY(180deg);
}
.card-word {
  font-size: clamp(2.5rem, 10vw, 4rem);
  font-weight: 700;
  word-break: break-all;
}
.answer-btn {
  height: 56px;
  font-size: 1.15rem;
}
.mode-group :deep(.el-radio) {
  height: auto;
  min-height: 32px;
}
</style>

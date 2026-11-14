<template>
  <!-- 練習中 / 結果頁：進度存在 localStorage，重新整理後接著練 -->
  <!-- 整頁禁止選取 / 長按選單 / 拖曳圖片：平板用觸控筆書寫時，手掌壓到畫面不會選到文字或跳出選單 -->
  <div
    class="no-select relative flex h-full flex-col gap-4 overflow-y-auto px-2 py-4 md:px-4"
    @selectstart.prevent
    @contextmenu.prevent
    @dragstart.prevent
  >
    <!-- 手寫層鋪滿整頁空白處（不跟著翻轉）；輕點會點到底下的卡片 / 按鈕，拖曳書寫，換題時隨 key 重建而清空 -->
    <VocabWritingPad
      v-if="showWriting && authStore.isLoggedIn && phase === 'study' && current"
      :key="`ink-${round}-${index}`"
    />
    <div class="flex shrink-0 flex-wrap items-center justify-between gap-2">
      <!-- 上排按鈕只顯示圖示，文字放在 title 當提示 -->
      <div class="flex flex-wrap items-center gap-2">
        <el-button
          class="above-ink"
          :icon="House"
          :title="t('vocab.back_to_list')"
          @click="router.push('/VocabSets')"
          type="warning"
          plain
        />
        <!-- 上一個 / 結束 只在練習中顯示，和「回單字集」同一排 -->
        <el-button
          v-if="authStore.isLoggedIn && phase === 'study' && current"
          class="above-ink"
          :icon="Back"
          :title="t('vocab.prev_word')"
          :disabled="!canGoBack"
          @click="goBack"
          type="info"
          plain
          style="margin-left: 0"
          >{{ t("vocab.prev_word") }}
        </el-button>
      </div>
      <div
        v-if="authStore.isLoggedIn && phase === 'study' && current"
        class="flex items-center gap-2"
      >
        <!-- 通勤模式的暫停 / 繼續，放在「結束」左邊 -->
        <el-button
          v-if="commuteMode"
          class="above-ink"
          :icon="commutePaused ? VideoPlay : VideoPause"
          :title="commutePaused ? t('vocab.resume') : t('vocab.pause')"
          type="primary"
          plain
          @click="toggleCommutePause"
        >
          {{ commutePaused ? t("vocab.resume") : t("vocab.pause") }}
        </el-button>
        <!-- Element Plus 沒有正方形的停止圖示，自己畫一個 -->
        <el-button
          class="above-ink"
          :title="t('vocab.end')"
          @click="finish"
          type="danger"
          plain
          style="margin-left: 0"
        >
          <el-icon>
            <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
              <rect
                x="192"
                y="192"
                width="640"
                height="640"
                rx="96"
                fill="currentColor"
              />
            </svg>
          </el-icon>
        </el-button>
      </div>
    </div>

    <div
      v-if="!authStore.isLoggedIn"
      class="py-20 text-center text-lg text-gray-400"
    >
      {{ t("vocab.login_required") }}
    </div>

    <!-- ===== 卡片練習 ===== -->
    <div
      v-else-if="phase === 'study' && current"
      class="flex flex-col items-center gap-4"
    >
      <div class="flex w-full max-w-xl flex-col gap-2">
        <div class="flex flex-wrap items-center justify-between gap-2">
          <span class="font-bold whitespace-nowrap text-gray-600"
            >{{ index + 1 }} / {{ cards.length }}</span
          >
          <div class="flex flex-wrap items-center justify-end gap-3">
            <!-- 通勤模式一律自動發音，開關改由上排的暫停 / 繼續取代 -->
            <el-switch
              v-if="!commuteMode"
              class="above-ink"
              v-model="autoPlay"
              :active-text="t('vocab.auto_play')"
            />
            <el-switch
              v-model="showKana"
              class="above-ink"
              :active-text="t('vocab.show_kana')"
            />
            <el-switch
              v-model="showRomaji"
              class="above-ink"
              :active-text="t('vocab.show_romaji')"
            />
            <el-switch
              v-model="showWriting"
              class="above-ink"
              :active-text="t('vocab.show_writing')"
            />
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
              :class="{ 'tight-word': showRomaji && current.romaji }"
            />
            <!-- 羅馬音位置同背面，由「顯示羅馬音」開關決定（背面一律顯示） -->
            <span
              v-if="showRomaji && current.romaji"
              class="back-romaji px-4 text-center"
            >
              {{ current.romaji }}
            </span>
            <span class="absolute bottom-3 text-xs text-gray-400">{{
              t(showWriting ? "vocab.writing_hint" : "vocab.tap_to_flip")
            }}</span>
          </div>
          <!-- 背面 -->
          <!-- 版面同正面，但一律標假名（不受「顯示假名」開關影響），下方依序羅馬音、意思 -->
          <div class="flip-face back">
            <span
              class="absolute top-3 left-4 max-w-[70%] truncate text-xs text-gray-400"
            >
              {{ current.set_title }}
            </span>
            <button
              type="button"
              class="absolute top-2 right-2 rounded-full p-2 hover:bg-blue-50"
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
              class="card-word back-word px-4 text-center"
            />
            <span
              v-if="(!hasRuby && current.kana) || current.romaji"
              class="back-romaji px-4 text-center"
            >
              <!-- <span v-if="!hasRuby && current.kana" class="back-kana">{{
                current.kana
              }}</span>
              <template v-if="!hasRuby && current.kana && current.romaji">
                ・
              </template>
               -->
              {{ current.romaji }}
            </span>
            <!-- 分隔線：上方是讀音區，下方是意思區 -->
            <span class="back-divider" />
            <span class="back-meaning px-6 text-center whitespace-pre-wrap">
              {{ current.meaning }}
            </span>
          </div>
        </div>
      </div>

      <div class="grid w-full max-w-xl grid-cols-2 gap-3">
        <el-button
          class="answer-btn above-ink"
          type="warning"
          size="large"
          :plain="currentAnswer === true"
          @click="answer(false)"
        >
          <el-icon class="mr-1"><CloseBold /></el-icon
          >{{ t("vocab.unfamiliar") }}
        </el-button>
        <el-button
          class="answer-btn above-ink"
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

    <!-- ===== 結果 ===== -->
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
        <el-button @click="reselect">{{ t("vocab.reselect") }}</el-button>
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
  VideoPause,
  CloseBold,
  Select,
  House,
} from "@element-plus/icons-vue";
import { useAuthStore, useVocabStore } from "@/stores/index.js";
import { useGoogleTTS } from "@/composables/useGoogleTTS.js";
import RubyWord from "@/components/vocab/RubyWord.vue";
import VocabWritingPad from "@/components/vocab/VocabWritingPad.vue";
import {
  SHOW_KANA_KEY,
  SHOW_ROMAJI_KEY,
  SHOW_WRITING_KEY,
  AUTO_PLAY_KEY,
  COMMUTE_KEY,
  FRONT_TIMES_KEY,
  BACK_TIMES_KEY,
  readFlag,
  saveFlag,
  readNumber,
  studyOwner,
  loadStudySession,
  saveStudySession,
  clearStudySession,
} from "@/utils/vocabStudyStorage.js";

// 通勤模式：每次發音之間、換下一張之前的停頓（毫秒）
const COMMUTE_GAP_MS = 800;
const COMMUTE_NEXT_MS = 1200;

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const vocabStore = useVocabStore();
const { speak, speakingKey, stop, unlock } = useGoogleTTS("ja");

// 保留 /en 前綴
const localePrefix = route.path.startsWith("/en/") ? "/en" : "";
const setupPath = `${localePrefix}/VocabStudy`;

// --- 練習狀態 ---
const phase = ref("study"); // study | result
const cards = ref([]);
const index = ref(0);
const flipped = ref(false);
const round = ref(0);
// 依題目位置存放：退回上一題重答時直接覆蓋
const results = ref([]); // [{ ...card, is_familiar }]
// 後端每次作答都會累加次數，所以先暫存、結束時才送出；已送出的題目不能再退回
const committed = ref(0);

// 每次狀態變動就寫回 localStorage，重新整理後才能接著練
const persist = () =>
  saveStudySession({
    owner: studyOwner(authStore.user),
    started: true,
    phase: phase.value,
    cards: cards.value,
    index: index.value,
    results: results.value,
    committed: committed.value,
    round: round.value,
  });

const showKana = ref(readFlag(SHOW_KANA_KEY, true));
watch(showKana, (v) => saveFlag(SHOW_KANA_KEY, v));
// 正面是否顯示羅馬音（背面一律顯示）
const showRomaji = ref(readFlag(SHOW_ROMAJI_KEY, false));
watch(showRomaji, (v) => saveFlag(SHOW_ROMAJI_KEY, v));
// 卡片下方的手寫練習板
const showWriting = ref(readFlag(SHOW_WRITING_KEY, true));
watch(showWriting, (v) => saveFlag(SHOW_WRITING_KEY, v));

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
// 通勤模式：正面念 N 次 → 翻面念 M 次 → 自動下一張（設定在開始學習頁調整）
const commuteMode = ref(readFlag(COMMUTE_KEY, false));
const frontTimes = ref(readNumber(FRONT_TIMES_KEY, 1));
const backTimes = ref(readNumber(BACK_TIMES_KEY, 1));
const commutePaused = ref(false);

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
// 每次啟動都換新的 token，舊的流程看到 token 變了就自行結束
let commuteToken = 0;
const stopCommute = () => {
  commuteToken += 1;
};

// 播完目前這張後切換 index，由下方 watch 接著播下一張
const runCommute = async () => {
  const myToken = ++commuteToken;
  const alive = () =>
    myToken === commuteToken &&
    phase.value === "study" &&
    commuteMode.value &&
    !commutePaused.value;
  const card = current.value;
  if (!card) return;
  const word = [card.kana || card.word, "ja"];
  // 背面念中文意思；沒有意思時退回念日文
  const meaning = card.meaning?.trim() ? [card.meaning, "zh-TW"] : word;
  for (const [face, times, [text, lang]] of [
    [false, frontTimes.value || 0, word],
    [true, backTimes.value || 0, meaning],
  ]) {
    if (!times) continue;
    flipped.value = face;
    for (let i = 0; i < times; i++) {
      if (!alive()) return;
      stop();
      await speak(text, card.vocab_word_id, lang);
      if (!alive()) return;
      await sleep(COMMUTE_GAP_MS);
    }
  }
  await sleep(COMMUTE_NEXT_MS - COMMUTE_GAP_MS);
  if (!alive()) return;
  if (index.value + 1 >= cards.value.length) {
    finish();
  } else {
    flipped.value = false;
    index.value += 1;
    persist();
  }
};

const toggleCommutePause = () => {
  commutePaused.value = !commutePaused.value;
  if (commutePaused.value) {
    stopCommute();
    stop();
  } else {
    unlock();
    runCommute();
  }
};

// 通勤時把螢幕保持亮著，避免鎖屏後瀏覽器暫停播放
let wakeLock = null;
const requestWakeLock = async () => {
  if (wakeLock || !navigator.wakeLock) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => (wakeLock = null));
  } catch {
    /* 不支援或被拒絕時忽略 */
  }
};
const releaseWakeLock = () => {
  wakeLock?.release().catch(() => {});
  wakeLock = null;
};
watch(
  () => phase.value === "study" && commuteMode.value,
  (on) => (on ? requestWakeLock() : releaseWakeLock()),
);

watch([round, index], () => {
  if (phase.value !== "study") return;
  if (commuteMode.value) {
    if (!commutePaused.value) runCommute();
  } else if (autoPlay.value) speakCurrent();
});

// 翻到背面一律念；翻回正面只在自動發音時念
// 先停掉正在播的，避免 speak 把同一張當成「再點一次=停止」
// 通勤模式下手動翻面視為接手操作，先暫停自動輪播
const flip = () => {
  if (commuteMode.value && !commutePaused.value) {
    commutePaused.value = true;
    stopCommute();
  }
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
  commutePaused.value = false;
  round.value += 1;
  phase.value = "study";
  persist();
};

let recordErrorShown = false;
// 送出尚未記錄的作答；記錄不阻塞畫面
const flushRecords = () => {
  const pending = results.value.slice(committed.value).filter(Boolean);
  committed.value = results.value.length;
  // committed 變了要立刻存，否則重新整理後同一題會再送一次
  if (pending.length) persist();
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
    persist();
  }
};

const goBack = () => {
  if (!canGoBack.value) return;
  stop();
  document.activeElement?.blur?.();
  flipped.value = false;
  index.value -= 1;
  persist();
};

const finish = () => {
  stopCommute();
  stop();
  flushRecords();
  phase.value = "result";
  persist();
};

// 切到背景（關分頁、手機切 App）時先送出，避免作答遺失
const onVisibilityChange = () => {
  if (document.visibilityState === "hidden" && phase.value === "study")
    flushRecords();
  // 切回前景時 wake lock 已被系統釋放，需重新取得
  if (
    document.visibilityState === "visible" &&
    phase.value === "study" &&
    commuteMode.value
  )
    requestWakeLock();
};

const restart = (list) =>
  beginRound(shuffle(list.map(({ is_familiar, ...card }) => card)));

// 回設定頁重新選學習集：這次練習到此結束
const reselect = () => {
  clearStudySession();
  router.push(setupPath);
};

// 鍵盤：空白/Enter 翻面，← 不熟悉，→ 熟悉，Backspace/↑ 上一個
// 鍵盤操作在 keyup 才觸發：按住不放不會連續觸發（keydown 會 auto-repeat）。
// keydown 只負責記錄「在本頁按下的鍵」並擋掉預設行為（空白捲動、Enter 點按鈕、Backspace）；
// 只有在本頁按下的鍵放開時才動作，避免從上一頁按 Enter 進來時放開就被當成翻面。
const STUDY_KEYS = new Set([
  " ",
  "Enter",
  "ArrowLeft",
  "ArrowRight",
  "Backspace",
  "ArrowUp",
]);
const pressedKeys = new Set();
const isTyping = (e) => {
  const tag = e.target?.tagName;
  return tag === "INPUT" || tag === "TEXTAREA";
};
const onKeydown = (e) => {
  if (phase.value !== "study" || isTyping(e) || !STUDY_KEYS.has(e.key)) return;
  if (e.key === " " || e.key === "Enter" || e.key === "Backspace")
    e.preventDefault();
  pressedKeys.add(e.key);
};
const onKeyup = (e) => {
  if (!pressedKeys.delete(e.key)) return;
  if (phase.value !== "study" || isTyping(e)) return;
  if (e.key === " " || e.key === "Enter") {
    flip();
  } else if (e.key === "ArrowLeft") {
    answer(false);
  } else if (e.key === "ArrowRight") {
    answer(true);
  } else if (e.key === "Backspace" || e.key === "ArrowUp") {
    goBack();
  }
};
// 視窗失焦時收不到 keyup，清掉避免殘留
const clearPressedKeys = () => pressedKeys.clear();

// --- 初始化：從 localStorage 還原進度 ---
const init = () => {
  if (!authStore.isLoggedIn) return;
  const saved = loadStudySession(studyOwner(authStore.user));
  if (!saved) {
    // 沒有進行中的練習（直接開網址或已被清掉）→ 回設定頁
    router.replace(setupPath);
    return;
  }
  if (!saved.started) {
    // 剛從設定頁按「開始」過來：走正常的開局流程（會觸發自動發音 / 輪播）
    beginRound(saved.cards);
    return;
  }
  // 重新整理後還原：接著上次的題目繼續
  cards.value = saved.cards;
  index.value = Math.min(saved.index ?? 0, saved.cards.length - 1);
  results.value = saved.results ?? [];
  committed.value = saved.committed ?? 0;
  round.value = saved.round ?? 1;
  phase.value = saved.phase === "result" ? "result" : "study";
  // 重新整理後沒有使用者操作，瀏覽器不允許自動出聲；輪播先暫停，按「繼續」再開始
  commutePaused.value = true;
};

// 在這頁才登入（或 token 過期重新登入）時也要還原進度
watch(
  () => authStore.isLoggedIn,
  (v) => v && init(),
);

onMounted(() => {
  document.title = `${t("vocab.study_title")} - ${t("site_title")}`;
  window.addEventListener("keydown", onKeydown);
  window.addEventListener("keyup", onKeyup);
  window.addEventListener("blur", clearPressedKeys);
  document.addEventListener("visibilitychange", onVisibilityChange);
  init();
});
onUnmounted(() => {
  window.removeEventListener("keydown", onKeydown);
  window.removeEventListener("keyup", onKeyup);
  window.removeEventListener("blur", clearPressedKeys);
  document.removeEventListener("visibilitychange", onVisibilityChange);
  stopCommute();
  releaseWakeLock();
  // 練習到一半離開頁面，已作答的仍要記錄
  flushRecords();
});
</script>

<style scoped>
.flip-card {
  position: relative;
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
/* 背面維持同色系，只用頂部色條提示已翻面，避免和下方綠色按鈕撞色 */
.back {
  background: #f8fafc;
  box-shadow:
    inset 0 4px 0 #3b82f6,
    0 6px 20px rgba(0, 0, 0, 0.12);
  transform: rotateY(180deg);
}
.back .back-word {
  color: #111827;
}
.back .back-word :deep(rt),
.back .back-kana {
  color: #3b82f6;
}
.back-romaji {
  color: #9ca3af;
  font-size: 16px;
  letter-spacing: 0.05em;
}
.back-divider {
  width: 48px;
  height: 1px;
  margin: 16px auto;
  background: #e5e7eb;
}
.back-meaning {
  color: #374151;
  font-size: clamp(1.25rem, 5vw, 1.75rem);
  font-weight: 400;
  line-height: 1.4;
}
.card-word {
  font-size: clamp(2.5rem, 10vw, 4rem);
  font-weight: 700;
  word-break: break-all;
}
/* RubyWord 的行高是為了上方假名留空間，下方也會多出一截；背面改用上方內距留假名位置，讓羅馬音緊貼單字 */
/* 正面開啟羅馬音時也用同樣排版，讓羅馬音位置和背面一致 */
.back .back-word,
.front .tight-word {
  line-height: 1.15;
  padding-top: 0.6em;
}
.no-select,
.no-select :deep(*) {
  user-select: none;
  -webkit-user-select: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
}
/* 鋪滿整頁的手寫層之上：按鈕與開關維持可直接點按（有 hover 效果） */
.above-ink {
  position: relative;
  z-index: 3;
}
.answer-btn {
  height: 56px;
  font-size: 1.15rem;
}
</style>

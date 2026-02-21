<template>
  <div class="flex h-full flex-col gap-4 px-4 py-4 lg:flex-row">
    <!-- 50音Menu -->
    <div class="w-full" :key="activeTab">
      <h2 class="mb-3 text-xl font-semibold">
        <el-tabs
          v-model="activeTab"
          class="w-fill mb-4 lg:max-w-md"
          @tab-change="handleTabChange"
        >
          <template v-for="tab in tabs" :key="tab.name">
            <el-tab-pane :label="t(tab.label)" :name="tab.name" />
          </template>
        </el-tabs>
      </h2>
      <div
        v-for="(row, rowIndex) in currentSounds_menu"
        :key="rowIndex"
        class="mb-2 flex"
      >
        <div
          v-for="sound in row"
          :key="sound.kana"
          class="mx-1 flex flex-1 items-center"
        >
          <el-button
            @click="selectSound(sound)"
            :type="isSelectedSound(sound) ? 'primary' : ''"
            :style="{ visibility: sound.kana ? 'visible' : 'hidden' }"
            class="grow"
          >
            {{ sound.kana }}
          </el-button>
        </div>
      </div>
    </div>
    <!-- 手寫互動區 -->
    <div class="w-full content-center">
      <el-card>
        <!-- 功能列 -->
        <div class="flex w-full items-center justify-between">
          <!-- 日文 -->
          <div
            class="inline-flex flex-col items-center text-3xl font-bold sm:text-5xl"
            :title="t('japanese')"
          >
            <span class="text-[12px] text-gray-600"> {{ t("japanese") }}</span>
            <span>{{ learningStore.writing_selectedSound.kana }}</span>
          </div>
          <!-- 羅馬字 -->
          <div
            class="inline-flex flex-col items-center text-3xl font-bold sm:text-4xl"
            :title="t('romaji')"
          >
            <span class="text-[12px] text-gray-600"> {{ t("romaji") }}</span>
            <span>{{ learningStore.writing_selectedSound.romaji }}</span>
          </div>
          <!-- 漢字來源 -->
          <div
            class="inline-flex flex-col items-center text-3xl font-bold sm:text-4xl"
            :title="t('kanji_source')"
          >
            <span class="text-[12px] text-gray-600">
              {{ t("kanji_source") }}</span
            >
            <span>{{ learningStore.writing_selectedSound.evo }}</span>
          </div>

          <!-- 自動撥放 -->
          <el-checkbox
            v-model="learningStore.writing_autoplay"
            class="hover:cursor-pointer"
          >
            {{ t("auto_play") }}
          </el-checkbox>

          <!-- 音檔播放控制 -->
          <div class="hover:cursor-pointer" @click="togglePlay">
            <img
              v-if="isPlaying"
              src="/images/volume2.png"
              alt="暫停"
              class="h-8 w-8 select-none"
            />
            <img
              v-else
              src="/images/volume.png"
              alt="播放"
              class="h-8 w-8 select-none"
            />
          </div>
        </div>

        <!-- 手寫區 -->
        <HandwritingCanvas
          ref="handwritingCanvas"
          class="select-none"
          :example-kana="learningStore.writing_selectedSound.kana"
          :current-type="activeTab"
          :show-example="true"
          :learning-module="LEARNING_MODULE"
          @changeSound="changeSound"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

import HandwritingCanvas from "@/components/HandwritingCanvas.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";
import { useApi } from "@/composables/useApi.js";
const MYAPI = useApi();
import { useWebAudio } from "@/composables/useWebAudio.js";
const { isPlaying, play: playAudio, stop: stopAudio } = useWebAudio();

/*-- store --*/
import { useLearningStore } from "@/stores/learning.js";
const learningStore = useLearningStore();

// 常數值設置
const TAB_TYPES = {
  HIRAGANA: "hiragana",
  KATAKANA: "katakana",
  DAKUON: "dakuon",
  HANDAKUON: "handakuon",
  YOON: "yoon",
};
const LEARNING_MODULE = "writing";
const fiftySounds = fiftySoundsData;
const activeTab = ref(learningStore.writing_tab);
// const selectedSound = ref({ kana: "あ", romaji: "a", evo: "安" });
const tabs = [
  { name: TAB_TYPES.HIRAGANA, label: "hiragana" },
  { name: TAB_TYPES.KATAKANA, label: "katakana" },
  { name: TAB_TYPES.DAKUON, label: "dakuon" },
  { name: TAB_TYPES.HANDAKUON, label: "handakuon" },
  { name: TAB_TYPES.YOON, label: "yoon" },
];

// CSS: 判斷當前單字
const isSelectedSound = (sound) =>
  learningStore.writing_selectedSound &&
  learningStore.writing_selectedSound.kana === sound.kana;

// 當前單字集, 如:あ, い, う, ..., ん
const currentSounds = computed(() => fiftySounds[activeTab.value] ?? []);

// 渲染當前單字集選單
const currentSounds_menu = computed(() => {
  const groups = [];

  // 預設5列, YOON為3列
  let groupSize = 5;
  if (activeTab.value === TAB_TYPES.YOON) {
    groupSize = 3;
  }

  for (let i = 0; i < currentSounds.value.length; i += groupSize) {
    groups.push(currentSounds.value.slice(i, i + groupSize));
  }
  return groups;
});

// 切換單字集時自動切換為新單字集第一個單字
watch(activeTab, () => {
  learningStore.writing_selectedSound = currentSounds.value[0];
});

// 切換單字時撥放發音
watch(
  () => learningStore.writing_selectedSound,
  async () => {
    if (learningStore.writing_autoplay) {
      await playSound();

      await MYAPI.post("/writing_changeSound", {
        learning_item: learningStore.writing_selectedSound.kana,
      });
    }
  },
);

// 切換當前單字
const selectSound = (sound) => {
  if (sound.kana) {
    learningStore.writing_selectedSound = sound;

    // 自動複製
    navigator.clipboard.writeText(sound.kana);
  }
};

// 尋找下一個單字
const findNextChar = (currentIndex, direction) => {
  const totalItems = currentSounds.value.length;
  let nextIndex = currentIndex;
  let loopCount = 0;

  while (loopCount < totalItems) {
    nextIndex = (nextIndex + direction + totalItems) % totalItems;
    if (currentSounds.value[nextIndex].kana) {
      return currentSounds.value[nextIndex];
    }
    loopCount++;
  }
};

// 切換單字
const changeSound = async (type) => {
  const currentIndex = currentSounds.value.findIndex(
    (sound) => sound.kana === learningStore.writing_selectedSound.kana,
  );

  const nextSound =
    type === "next"
      ? findNextChar(currentIndex, 1)
      : findNextChar(currentIndex, -1);

  selectSound(nextSound);
};

// 播放單字發音
const playSound = async () => {
  stopAudio(); // 先停止當前播放
  const currentRomaji = learningStore.writing_selectedSound.romaji;
  const audioUrl = `/sounds/${currentRomaji}.mp3`;
  await playAudio(audioUrl);
};

// Click: 播放單字發音
const togglePlay = async () => {
  await playSound();
};

// Event: 左右鍵切換單字
const handleKeydown = (event) => {
  if (event.key === "ArrowLeft") {
    changeSound("prev");
  } else if (event.key === "ArrowRight") {
    changeSound("next");
  }
};

const handleTabChange = (tabName) => {
  learningStore.writing_tab = tabName;
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
});
</script>

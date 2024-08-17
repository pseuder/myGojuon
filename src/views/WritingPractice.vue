<template>
  <div class="flex flex-col md:flex-row h-full px-4 py-4 gap-4">
    <!-- 50音列表 -->
    <div class="w-full" :key="activeTab">
      <h2 class="text-xl font-semibold mb-3">
        <el-tabs v-model="activeTab" class="mb-4">
          <el-tab-pane
            v-for="tab in tabs"
            :key="tab.name"
            :label="tab.label"
            :name="tab.name"
          />
        </el-tabs>
      </h2>
      <div
        v-for="(row, rowIndex) in groupedSounds"
        :key="rowIndex"
        class="flex mb-2"
      >
        <div
          v-for="sound in row"
          :key="sound.kana"
          class="flex-1 mx-1 flex items-center"
        >
          <el-button
            @click="selectSound(sound)"
            :type="isSelectedSound(sound) ? 'primary' : ''"
            :style="{ visibility: sound.kana ? 'visible' : 'hidden' }"
            class="flex-grow"
          >
            {{ sound.kana }}
          </el-button>
        </div>
      </div>
    </div>
    <!-- 手寫互動區 -->
    <div class="w-full content-center">
      <!-- body-style="display: flex; flex-direction: column; gap: 15px" -->
      <el-card>
        <!-- 功能列 -->
        <div class="w-full flex items-center justify-between">
          <!-- 日文 -->
          <div class="text-5xl font-bold">{{ selectedSound.kana }}</div>
          <!-- 羅馬字 -->
          <div class="text-4xl font-bold">{{ selectedSound.romaji }}</div>
          <!-- 漢字來源 -->
          <div class="text-4xl font-bold">{{ selectedSound.evo }}</div>

          <!-- 音檔播放控制 -->
          <audio
            ref="audioPlayer"
            :src="`/sounds/${selectedSound.romaji}.mp3`"
            @ended="audioEnded"
          ></audio>
          <el-button @click="togglePlay" type="text">
            <img
              v-if="isPlaying"
              src="/images/pause.svg"
              alt="暫停"
              class="w-8 h-8"
            />
            <img v-else src="/images/play.svg" alt="播放" class="w-8 h-8" />
          </el-button>

          <!-- 上一個、下一個按鈕 -->
          <div class="flex items-center gap-4">
            <img
              src="/images/arrow-circle-left-solid.svg"
              alt="上一個"
              class="w-8 h-8 cursor-pointer"
              @click="changeSound('prev')"
            />
            <img
              src="/images/arrow-circle-right-solid.svg"
              alt="下一個"
              class="w-8 h-8 cursor-pointer"
              @click="changeSound('next')"
            />
          </div>
        </div>

        <!-- 手寫區 -->
        <HandwritingCanvas
          ref="handwritingCanvas"
          :example-kana="selectedSound.kana"
          :show-example="true"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from "vue";
import { CaretLeft, CaretRight } from "@element-plus/icons-vue";
import { ElMessageBox, ElMessage } from "element-plus";
import HandwritingCanvas from "@/components/HandwritingCanvas.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";

const fiftySounds = ref(fiftySoundsData);
const activeTab = ref("hiragana");
const selectedSound = ref({ kana: "あ", romaji: "a", evo: "安" });
const handwritingCanvas = ref(null);
const audioPlayer = ref(null);
const isPlaying = ref(false);

const tabs = [
  { name: "hiragana", label: "平假名" },
  { name: "katakana", label: "片假名" },
  { name: "dakuon", label: "濁音" },
  { name: "handakuon", label: "半濁音" },
  { name: "yoon", label: "拗音" },
];

const currentSounds = computed(() =>
  fiftySounds.value ? fiftySounds.value[activeTab.value] : []
);

const groupedSounds = computed(() => {
  const groups = [];
  const groupSize = activeTab.value === "yoon" ? 3 : 5;
  for (let i = 0; i < currentSounds.value.length; i += groupSize) {
    groups.push(currentSounds.value.slice(i, i + groupSize));
  }
  return groups;
});

watch(
  selectedSound,
  (newSound, oldSound) => {
    if (newSound !== oldSound) {
      if (audioPlayer.value) {
        audioPlayer.value.load(); // 加载新的音频文件
        // 使用 nextTick 确保音频加载完成后再播放
        nextTick(() => {
          playSound();
        });
      }
    }
  },
  { deep: true }
);

watch(activeTab, () => {
  selectedSound.value = currentSounds.value[0];
});

const findNextValidKana = (currentIndex, direction) => {
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

  return null;
};

const changeSound = (type) => {
  const currentIndex = currentSounds.value.findIndex(
    (sound) => sound.kana === selectedSound.value.kana
  );

  const nextSound =
    type === "next"
      ? findNextValidKana(currentIndex, 1)
      : findNextValidKana(currentIndex, -1);

  if (nextSound) {
    selectSound(nextSound);
  }
};

const togglePlay = () => {
  if (audioPlayer.value) {
    if (isPlaying.value) {
      audioPlayer.value.pause();
    } else {
      audioPlayer.value.play();
    }
    isPlaying.value = !isPlaying.value;
  }
};

const audioEnded = () => {
  isPlaying.value = false;
};

const playSound = () => {
  if (audioPlayer.value) {
    audioPlayer.value.currentTime = 0; // 重置音频到开始位置
    audioPlayer.value.play();
    isPlaying.value = true;
  }
};

const selectSound = (sound) => {
  if (sound.kana) {
    selectedSound.value = sound;
  }
};

const isSelectedSound = (sound) =>
  selectedSound.value && selectedSound.value.kana === sound.kana;

const handleKeydown = (event) => {
  if (event.key === "ArrowLeft") {
    changeSound("prev");
  } else if (event.key === "ArrowRight") {
    changeSound("next");
  }
};

onMounted(() => {
  window.addEventListener("keydown", handleKeydown);
  // 初始加载时播放第一个音频
  nextTick(() => {
    playSound();
  });
});

onUnmounted(() => {
  window.removeEventListener("keydown", handleKeydown);
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    audioPlayer.value.src = "";
  }
});
</script>

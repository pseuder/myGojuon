<template>
  <div class="container w-[90vw] md:w-[80vw] h-[70vh]">
    <div class="flex flex-wrap h-full">
      <!-- 左側50音列表 -->
      <div class="w-full lg:w-1/2 px-2 mb-4" :key="activeTab">
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
      <!-- 右側手寫區 -->
      <div class="w-full lg:w-1/2 h-full px-2">
        <el-card
          v-if="selectedSound"
          class="h-full"
          body-style="height: 100%; display: flex; flex-direction: column; gap: 15px"
        >
          <div class="h-12 flex items-center">
            <div class="flex-grow flex gap-4 self-center items-center">
              <div class="text-5xl font-bold w-max">
                {{ selectedSound.kana }}
              </div>
              <div class="text-4xl font-bold">{{ selectedSound.romaji }}</div>
              <div class="text-4xl font-bold">{{ selectedSound.evo }}</div>
            </div>

            <div class="flex gap-2">
              <audio
                ref="audioPlayer"
                :src="`/sounds/${selectedSound.romaji}.mp3`"
                @ended="audioEnded"
              ></audio>
              <el-button
                @click="togglePlay"
                type="text"
                style="font-size: 35px; padding: 0; margin: 0; line-height: 1"
              >
                {{ isPlaying ? "⏸" : "▶️" }}
              </el-button>
              <el-button @click="changeSound('prev')" type="warning" circle>
                <el-icon size="30" color="white"><CaretLeft /></el-icon>
              </el-button>
              <el-button @click="changeSound('next')" type="warning" circle>
                <el-icon size="30" color="white"><CaretRight /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="flex-grow">
            <HandwritingCanvas
              ref="handwritingCanvas"
              :example-kana="selectedSound.kana"
              :show-example="true"
            />
          </div>
        </el-card>
        <el-empty v-else description="請選擇一個音節" />
      </div>
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
  { name: "hiragana", label: "(清音)平假名" },
  { name: "katakana", label: "(清音)片假名" },
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

<template>
  <div class="container learn-container">
    <div class="flex flex-wrap">
      <!-- 左侧50音列表 -->
      <div class="w-full lg:w-1/2 px-2 mb-4" :key="activeTab">
        <h2 class="text-xl font-semibold mb-3">
          <el-tabs v-model="activeTab" class="mb-4">
            <el-tab-pane label="(清音)平假名" name="hiragana"></el-tab-pane>
            <el-tab-pane label="(清音)片假名" name="katakana"></el-tab-pane>
            <el-tab-pane label="濁音" name="dakuon"></el-tab-pane>
            <el-tab-pane label="半濁音" name="handakuon"></el-tab-pane>
            <el-tab-pane label="拗音" name="yoon"></el-tab-pane>
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
              :type="
                selectedSound && selectedSound.kana === sound.kana
                  ? 'primary'
                  : ''
              "
              :style="{ visibility: sound.kana ? 'visible' : 'hidden' }"
              class="flex-grow"
            >
              {{ sound.kana }}
            </el-button>
          </div>
        </div>
      </div>
      <!-- 右侧显示区和手写区 -->
      <div class="w-full h-[500px] lg:w-1/2 px-2">
        <el-card
          v-if="selectedSound"
          class="h-full"
          body-style="height: 100%; display: flex; flex-direction: column; gap: 15px"
        >
          <div class="h-12 flex items-center gap-10">
            <div class="flex-grow flex gap-4 self-center items-center">
              <div class="text-5xl font-bold w-max">
                {{ selectedSound.kana }}
              </div>
              <div class="text-4xl font-bold">{{ selectedSound.romaji }}</div>
              <div class="text-4xl font-bold">{{ selectedSound.evo }}</div>
            </div>

            <div class="flex gap-4">
              <el-button
                @click="playSound(selectedSound)"
                type="text"
                style="font-size: 35px; padding: 0; margin: 0; line-height: 1"
              >
                🔊
              </el-button>
              <el-button @click="changeSound('prev')" type="warning " circle>
                <el-icon size="30" color="brown"><CaretLeft /></el-icon>
              </el-button>
              <el-button @click="changeSound('next')" type="warning" circle>
                <el-icon size="30" color="brown"><CaretRight /></el-icon>
              </el-button>
            </div>
          </div>
          <div class="flex-grow">
            <HandwritingCanvas
              ref="handwritingCanvas"
              @clear="clearSelectedSound"
              @autoDetect="autoDetect"
              :exampleKana="selectedSound.kana"
            />
          </div>
        </el-card>
        <el-empty v-else description="請選擇一個音節"></el-empty>
      </div>
    </div>
  </div>
</template>
<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";
import { CaretLeft, CaretRight } from "@element-plus/icons-vue";
import { ElMessageBox } from "element-plus";

import HandwritingCanvas from "@/components/HandwritingCanvas.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";

const fiftySounds = ref(fiftySoundsData);
const activeTab = ref("hiragana");
const selectedSound = ref({ kana: "あ", romaji: "a", evo: "安" });
const handwritingCanvas = ref(null);
const audio = ref(null);

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

  return null; // 如果所有項目都是空的，返回 null
};

function changeSound(type) {
  const currentIndex = currentSounds.value.findIndex(
    (sound) => sound.kana === selectedSound.value.kana
  );

  let nextSound = null;

  if (type === "next") {
    nextSound = findNextValidKana(currentIndex, 1);
  } else if (type === "prev") {
    nextSound = findNextValidKana(currentIndex, -1);
  }

  if (nextSound) {
    selectSound(nextSound);
  }
}

onMounted(async () => {
  window.addEventListener("keydown", (event) => {
    if (event.key === "ArrowLeft") {
      changeSound("prev");
    } else if (event.key === "ArrowRight") {
      changeSound("next");
    }
  });
});

onUnmounted(() => {
  audioCache.forEach((audio) => {
    audio.pause();
    audio.src = "";
  });
  audioCache.clear();
});

const currentSounds = computed(() => {
  return fiftySounds.value ? fiftySounds.value[activeTab.value] : [];
});

const groupedSounds = computed(() => {
  const groups = [];
  let groupSize = activeTab.value === "yoon" ? 3 : 5;
  for (let i = 0; i < currentSounds.value.length; i += groupSize) {
    groups.push(currentSounds.value.slice(i, i + groupSize));
  }
  return groups;
});

watch(activeTab, () => {
  if (handwritingCanvas.value) {
    handwritingCanvas.value.clearCanvas();
  }

  const firstFewSounds = currentSounds.value.slice(0, 5);
  firstFewSounds.forEach((sound) => {
    if (sound.kana) {
      preloadAudio(sound.romaji);
    }
  });
});

// 音頻緩存系統
const audioCache = new Map();

// 預加載音頻
const preloadAudio = (romaji) => {
  if (!audioCache.has(romaji)) {
    const audio = new Audio(`/sounds/${romaji}.mp3`);
    audio.load(); // 預加載音頻
    audioCache.set(romaji, audio);
  }
};

const selectSound = (sound) => {
  if (sound.kana) {
    selectedSound.value = sound;
    playSound(sound);
    if (handwritingCanvas.value) {
      handwritingCanvas.value.clearCanvas();
    }
    preloadAudio(sound.romaji); // 預加載當前音頻
    // 預加載下一個和上一個音頻
    const currentIndex = currentSounds.value.findIndex(
      (s) => s.kana === sound.kana
    );
    const nextSound = findNextValidKana(currentIndex, 1);
    const prevSound = findNextValidKana(currentIndex, -1);
    if (nextSound) preloadAudio(nextSound.romaji);
    if (prevSound) preloadAudio(prevSound.romaji);
  }
};

const clearSelectedSound = () => {
  selectedSound.value = null;
};

const playSound = (sound) => {
  const romaji = sound.romaji;
  if (audioCache.has(romaji)) {
    console.log("Playing cached audio:", romaji);
    const audio = audioCache.get(romaji);
    audio.currentTime = 0; // 重置音頻播放位置
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
    });
  } else {
    console.log("Playing audio:", romaji);
    preloadAudio(romaji);
    audioCache
      .get(romaji)
      .play()
      .catch((error) => {
        console.error("Error playing audio:", error);
      });
  }
};

function autoDetect(predictKana) {
  if (predictKana == selectedSound.value.kana) {
    ElMessage({
      type: "success",
      message: predictKana,
    });
    changeSound("next");
  }
}
</script>

<style scoped>
.learn-container {
}
</style>

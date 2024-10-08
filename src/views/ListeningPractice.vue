<template>
  <div class="flex flex-col md:flex-row h-full px-4 py-4 gap-4">
    <!-- 左側50音列表 -->
    <div class="w-full flex flex-col gap-4">
      <div class="flex gap-4 items-center">
        <audio ref="audioPlayer" :src="`/sounds/${selectedSound.romaji}.mp3`" @ended="audioEnded"></audio>
        <el-button @click="togglePlay" type="text">
          <img v-if="isPlaying" src="/images/pause.svg" alt="暫停" class="w-8 h-8" />
          <img v-else src="/images/play.svg" alt="播放" class="w-8 h-8" />
        </el-button>

        <!-- 選擇字符集 -->
        <el-select v-model="activeTab" placeholder="選擇字符集" style="width: 100px">
          <el-option key="hiragana" label="平假名" value="hiragana" />
          <el-option key="katakana" label="片假名" value="katakana" />
          <el-option key="dakuon" label="濁音" value="dakuon" />
          <el-option key="handakuon" label="半濁音" value="handakuon" />
          <el-option key="yoon" label="拗音" value="yoon" />
        </el-select>

        <!-- 隨機、循序模式切換 -->
        <el-switch v-model="isRandomMode" active-text="隨機" inactive-text="循序" @change="handleModeChange" />

        <!-- 上一個、下一個按鈕 -->
        <div class="flex items-center gap-4">
          <img src="/images/arrow-circle-left-solid.svg" alt="上一個" class="w-8 h-8 cursor-pointer"
            @click="changeSound('prev')" />
          <img src="/images/arrow-circle-right-solid.svg" alt="下一個" class="w-8 h-8 cursor-pointer"
            @click="changeSound('next')" />
        </div>
      </div>

      <el-button @click="handwritingCanvas.sendCanvasImageToBackend()" type="primary" class="w-full h-12"
        v-loading="handwritingCanvas?.isSending">
        自動辨識(實驗性)
      </el-button>

      <div class="flex gap-4 items-center">
        <div>預測值：{{ predictKana }}</div>
        <div>信心值：{{ predictConfidence.toString().slice(0, 5) }}</div>
        <el-popover placement="bottom" :width="300" trigger="click">
          <template #reference>
            <el-button type="text" class="text-lg">第{{ round }}輪</el-button>
          </template>

          <div class="sound-grid">
            <div v-for="(count, sound) in soundCounts" :key="sound" class="sound-item">
              <span class="sound">{{ sound }}</span>
              <span class="count" :class="{
                active1: count == 1,
                active2: count == 2,
                active3: count == 3,
                active: count > 3,
              }">{{ count }}</span>
            </div>
          </div>
        </el-popover>
      </div>

      <el-button @click="showCurrentWord = !showCurrentWord" type="text">
        {{ showCurrentWord ? "隱藏" : "顯示" }}答案
      </el-button>

      <div v-if="showCurrentWord" class="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 class="text-xl font-bold mb-2">當前單字信息：</h3>
        <p><strong>假名：</strong>{{ selectedSound.kana }}</p>
        <p><strong>羅馬字：</strong>{{ selectedSound.romaji }}</p>
        <p><strong>漢字：</strong>{{ selectedSound.evo }}</p>
      </div>
    </div>
    <!-- 右側手寫區 -->
    <div class="w-full content-center">
      <el-card>
        <HandwritingCanvas ref="handwritingCanvas" @auto-detect="autoDetect" :example-kana="selectedSound.kana"
          :show-example="false" :current-type="activeTab" :learning-module="'listening'" />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, nextTick } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import HandwritingCanvas from "@/components/HandwritingCanvas.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";

const fiftySounds = ref(fiftySoundsData);
const activeTab = ref("hiragana");
const selectedSound = ref({ kana: "あ", romaji: "a", evo: "安" });
const handwritingCanvas = ref(null);
const audioPlayer = ref(null);
const isPlaying = ref(false);
const isRandomMode = ref(false);
const showCurrentWord = ref(false);

const predictKana = ref("");
const predictConfidence = ref(0);

const soundCounts = reactive({});
const round = ref(1);

const currentSounds = computed(() =>
  fiftySounds.value ? fiftySounds.value[activeTab.value] : []
);

// 監聽 currentSounds 的變化，如果變化則重新初始化計數器
watch(currentSounds, () => {
  initializeCounts();
  round.value = 1;
});

// 初始化計數器
const initializeCounts = () => {
  currentSounds.value.forEach((sound) => {
    if (sound.kana) {
      soundCounts[sound.kana] = 0;
    }
  });
};

initializeCounts();

watch(
  selectedSound,
  (newSound, oldSound) => {
    if (newSound !== oldSound) {
      if (audioPlayer.value) {
        audioPlayer.value.load();
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

const handleModeChange = () => {
  ElMessage.success(
    isRandomMode.value ? "已切換到隨機模式" : "已切換到循序模式"
  );
};

const getRandomSound = () => {
  const validSounds = currentSounds.value.filter((sound) => sound.kana);
  const availableSounds = validSounds.filter(
    (sound) => soundCounts[sound.kana] < round.value
  );

  if (availableSounds.length === 0) {
    // 所有音都已經出現了，開始新的一輪
    round.value++;
    return getRandomSound(); // 遞迴調用以獲取新一輪的聲音
  }

  const randomIndex = Math.floor(Math.random() * availableSounds.length);
  const selectedSound = availableSounds[randomIndex];
  soundCounts[selectedSound.kana]++;

  return selectedSound;
};

const changeSound = (type) => {
  if (isRandomMode.value) {
    selectSound(getRandomSound());
  } else {
    const currentIndex = currentSounds.value.findIndex(
      (sound) => sound.kana === selectedSound.value.kana
    );

    const nextSound =
      type === "next"
        ? findNextValidKana(currentIndex, 1)
        : findNextValidKana(currentIndex, -1);

    if (nextSound) {
      // Increment the count for the current sound before moving to the next
      soundCounts[selectedSound.value.kana]++;
      selectSound(nextSound);
    }
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

const clearSelectedSound = () => {
  selectedSound.value = null;
};

const autoDetect = (predict_res) => {
  const { predicted_hiragana, confidence } = predict_res;

  predictKana.value = predicted_hiragana;
  predictConfidence.value = confidence;

  if (predicted_hiragana === selectedSound.value.kana) {
    ElMessage.success("正確！: " + predicted_hiragana);
    // Increment the count for the current sound
    soundCounts[selectedSound.value.kana]++;
    changeSound("next");
  } else {
    ElMessage.error("錯誤！: " + predicted_hiragana);
  }
};

const isSelectedSound = (sound) =>
  selectedSound.value && selectedSound.value.kana === sound.kana;

onMounted(() => {
  nextTick(() => {
    playSound();
  });
});
</script>

<style scoped>
.sound-counts-container {
  font-family: Arial, sans-serif;
  width: 300px;
  padding: 10px;
  background-color: #f8f8f8;
  border: 1px solid #ddd;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

h3 {
  margin: 0 0 10px;
  text-align: center;
  color: #333;
  font-size: 16px;
}

.sound-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
}

.sound-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #fff;
  padding: 3px;
  border-radius: 4px;
  font-size: 12px;
}

.sound {
  font-weight: bold;
}

.count {
  margin-top: 2px;
  background-color: #e0e0e0;
  color: #666;
  padding: 1px 4px;
  border-radius: 8px;
  font-size: 10px;
}

.count.active1 {
  background-color: #4caf50;
  color: white;
}

.count.active2 {
  background-color: #2196f3;
  color: white;
}

.count.active3 {
  background-color: #ff9800;
  color: white;
}

.count.active {
  background-color: #f44336;
  color: white;
}
</style>

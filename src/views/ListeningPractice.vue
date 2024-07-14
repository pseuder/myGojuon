<template>
  <div class="container w-[80vw]">
    <div class="flex flex-wrap">
      <!-- 左側50音列表 -->
      <div class="w-full lg:w-1/2 px-2 mb-4 gap-8 flex flex-col">
        <div class="flex gap-4">
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

          <el-select
            v-model="activeTab"
            placeholder="選擇假名"
            size="small"
            style="width: 100px"
          >
            <el-option key="hiragana" label="平假名" value="hiragana" />
            <el-option key="katakana" label="片假名" value="katakana" />
            <el-option key="dakuon" label="濁音" value="dakuon" />
            <el-option key="handakuon" label="半濁音" value="handakuon" />
            <el-option key="yoon" label="拗音" value="yoon" />
          </el-select>

          <el-switch
            v-model="isRandomMode"
            active-text="隨機"
            inactive-text="循序"
            @change="handleModeChange"
          />
          <el-button @click="changeSound('prev')" type="warning" circle>
            <el-icon size="30" color="white"><CaretLeft /></el-icon>
          </el-button>
          <el-button @click="changeSound('next')" type="warning" circle>
            <el-icon size="30" color="white"><CaretRight /></el-icon>
          </el-button>
        </div>

        <div>
          <el-button
            @click="handwritingCanvas.sendCanvasImageToBackend()"
            type="primary"
            class="w-full h-12"
            v-loading="handwritingCanvas?.isSending"
          >
            自動辨識(實驗性)
          </el-button>
        </div>

        <div class="flex gap-4">
          <div>預測值：{{ predictKana }}</div>
          <div>信心值：{{ predictConfidence.toString().slice(0, 5) }}</div>
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
      <div class="w-full h-[500px] lg:w-1/2 px-2">
        <el-card
          v-if="selectedSound"
          class="h-full"
          body-style="height: 100%; display: flex; flex-direction: column; gap: 15px"
        >
          <div class="flex-grow">
            <HandwritingCanvas
              ref="handwritingCanvas"
              @auto-detect="autoDetect"
              :example-kana="selectedSound.kana"
              :show-example="false"
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
const isRandomMode = ref(false);
const showCurrentWord = ref(false);

const predictKana = ref("");
const predictConfidence = ref(0);

const currentSounds = computed(() =>
  fiftySounds.value ? fiftySounds.value[activeTab.value] : []
);

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
  handwritingCanvas.value?.clearCanvas();
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
  ElMessage.info(isRandomMode.value ? "已切換到隨機模式" : "已切換到循序模式");
};

const getRandomSound = () => {
  const validSounds = currentSounds.value.filter((sound) => sound.kana);
  return validSounds[Math.floor(Math.random() * validSounds.length)];
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
    handwritingCanvas.value?.clearCanvas();
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

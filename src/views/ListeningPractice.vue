<template>
  <div class="flex flex-col md:flex-row h-full px-4 py-4 gap-4">
    <!-- 左側50音列表 -->
    <div class="w-full flex flex-col gap-4">
      <div class="flex gap-4 items-center">
        <audio
          ref="audioPlayer"
          :src="`/sounds/${selectedSound.romaji}.mp3`"
          @ended="audioEnded"
        ></audio>

        <div class="hover:cursor-pointer" @click="togglePlay">
          <img
            v-if="isPlaying"
            src="/images/volume2.png"
            alt="暫停"
            class="w-8 h-8"
          />
          <img v-else src="/images/volume.png" alt="播放" class="w-8 h-8" />
        </div>

        <!-- 選擇字符集 -->
        <el-select
          v-model="activeTab"
          placeholder="選擇字符集"
          style="width: 130px"
        >
          <el-option key="hiragana" :label="t('hiragana')" value="hiragana" />
          <el-option key="katakana" :label="t('katakana')" value="katakana" />
          <el-option key="dakuon" :label="t('dakuon')" value="dakuon" />
          <el-option
            key="handakuon"
            :label="t('handakuon')"
            value="handakuon"
          />
          <el-option key="yoon" :label="t('yoon')" value="yoon" />
        </el-select>

        <!-- 隨機、循序模式切換 -->
        <el-switch
          v-model="isRandomMode"
          :active-text="t('random')"
          :inactive-text="t('sequential')"
          @change="handleModeChange"
        />

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

      <el-button
        v-if="user"
        @click="handwritingCanvas.sendCanvasImageToBackend()"
        type="primary"
        class="w-full h-12"
        v-loading="handwritingCanvas?.isSending"
        :disabled="activeTab === 'yoon'"
      >
        {{ t("ai_recognition") }}
      </el-button>
      <el-button v-else type="primary" class="w-full h-12" :disabled="true">
        {{ t("login_to_enable_ai_recognition") }}
      </el-button>

      <div class="flex gap-4 items-center">
        <div>{{ t("predicted_value") }}：{{ predictKana }}</div>
        <div>
          {{ t("confidence_level") }}：{{
            predictConfidence.toString().slice(0, 5)
          }}
        </div>
        <el-popover placement="bottom" :width="300" trigger="click">
          <template #reference>
            <el-tag type="success" class="text-lg hover:cursor-pointer"
              >Round {{ round }}</el-tag
            >
          </template>

          <div class="sound-grid">
            <div
              v-for="(count, sound) in soundCounts"
              :key="sound"
              class="sound-item"
            >
              <span class="sound">{{ sound }}</span>
              <span
                class="count"
                :class="{
                  active1: count == 1,
                  active2: count == 2,
                  active3: count == 3,
                  active: count > 3,
                }"
                >{{ count }}</span
              >
            </div>
          </div>
        </el-popover>
      </div>

      <el-tag
        class="hover:cursor-pointer"
        @click="showCurrentWord = !showCurrentWord"
        type="danger"
      >
        {{ showCurrentWord ? t("hide_answer") : t("show_answer") }}
      </el-tag>

      <div v-if="showCurrentWord" class="mt-4 p-4 bg-gray-100 rounded-lg">
        <h3 class="text-xl font-bold mb-2">{{ t("") }}</h3>
        <p>
          <strong>{{ t("japanese") }}：</strong>{{ selectedSound.kana }}
        </p>
        <p>
          <strong>{{ t("romaji") }}：</strong>{{ selectedSound.romaji }}
        </p>
        <p>
          <strong>{{ t("kanji") }}：</strong>{{ selectedSound.evo }}
        </p>
      </div>
    </div>
    <!-- 右側手寫區 -->
    <div class="w-full content-center">
      <el-card>
        <HandwritingCanvas
          ref="handwritingCanvas"
          @auto-detect="autoDetect"
          :example-kana="selectedSound.kana"
          :show-example="false"
          :current-type="activeTab"
          :learning-module="'listening'"
        />
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, nextTick } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import HandwritingCanvas from "@/components/HandwritingCanvas.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";
import axios, { getUserInfo } from "@/utils/axios";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

const user = getUserInfo();

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

let soundCounts = reactive({});
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
  // reset soundCounts
  soundCounts = {};
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

  // 重置soundCounts
  initializeCounts();
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
    isRandomMode.value ? t("switch_to_random") : t("switch_to_sequential")
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
  // soundCounts[selectedSound.kana]++;

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
      // soundCounts[selectedSound.value.kana]++;
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

    const dataToSend = {
      learningModule: "listening",
      learningMethod: "changeSound",
      learningItem: sound.kana,
    };

    // 發送數據到後端
    axios.post("/record_activity", dataToSend).catch((error) => {
      console.error("Error recording activity:", error);
    });
  }
};

const clearSelectedSound = () => {
  selectedSound.value = null;
};

// 特殊對應關係配置
const SPECIAL_KANA_MATCHES = {
  な: ["な", "お"],
  も: ["も", "を"],
  り: ["り", "け"],
  ぜ: ["ぜ", "だ"],
  ぞ: ["ぞ", "だ"],
  ぱ: ["ぱ", "ぽ"],
};

const autoDetect = (predict_res) => {
  const { predicted_hiragana, confidence } = predict_res;
  const currentKana = selectedSound.value.kana;

  // 更新預測結果
  predictKana.value = predicted_hiragana;
  predictConfidence.value = confidence;

  // 檢查是否匹配
  const isCorrect = checkKanaMatch(currentKana, predicted_hiragana);

  if (isCorrect) {
    handleCorrectPrediction(currentKana);
  } else {
    handleIncorrectPrediction(predicted_hiragana);
  }

  try {
    const dataToSend = {
      learningModule: "listening",
      learningMethod: "predict",
      learningItem: currentKana,
      correctness: isCorrect,
    };

    // 發送數據到後端
    axios.post("/record_activity", dataToSend).catch((error) => {
      console.error("Error recording activity:", error);
    });
  } catch (error) {
    console.error("Error recording activity:", error);
  }
};

// 檢查假名是否匹配
const checkKanaMatch = (currentKana, predictedKana) => {
  // 檢查特殊情況
  if (currentKana in SPECIAL_KANA_MATCHES) {
    return SPECIAL_KANA_MATCHES[currentKana].includes(predictedKana);
  }
  // 一般情況
  return currentKana === predictedKana;
};

// 處理正確預測
const handleCorrectPrediction = (currentKana) => {
  predictKana.value = currentKana;
  ElMessage.success(t("corrent") + `！: ${currentKana}`);
  soundCounts[currentKana]++;
  changeSound("next");
};

// 處理錯誤預測
const handleIncorrectPrediction = (predictedKana) => {
  ElMessage.error(t("incorrect") + `！: ${predictedKana}`);
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

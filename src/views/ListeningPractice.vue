<template>
  <div class="flex h-full flex-col gap-4 px-4 py-4 md:flex-row">
    <!-- 左側50音列表 -->
    <div class="flex w-full flex-col gap-2 md:gap-4">
      <div class="flex items-center gap-4">
        <div class="hover:cursor-pointer" @click="togglePlay">
          <img
            v-if="isPlaying"
            src="/images/volume2.png"
            alt="暫停"
            class="h-8 w-8"
          />
          <img v-else src="/images/volume.png" alt="播放" class="h-8 w-8" />
        </div>

        <!-- 選擇字符集 -->
        <el-select
          v-model="learningStore.listening_tab"
          placeholder="選擇字符集"
          @change="handleTabChange"
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
          <el-option
            key="special"
            :label="t('special_sounds')"
            value="special"
            :disabled="learningStore.listening_specialLearningList.length === 0"
            style="color: #00d4d4"
          />
        </el-select>

        <el-button @click="handleSpecialLearning" link>
          <img
            src="/images/student.png"
            alt="進行特別學習"
            class="inline-block h-8 w-10"
            title="進行特別學習"
          />
        </el-button>
      </div>

      <div class="flex items-center gap-4">
        <!-- 隨機、循序模式切換 -->
        <el-switch
          v-model="learningStore.listening_mode"
          :active-text="t('random')"
          :inactive-text="t('sequential')"
          @change="handleModeChange"
        />

        <div>{{ t("predicted_value") }}：{{ predictKana }}</div>
      </div>

      <div class="flex items-center justify-between gap-2">
        <!-- 學習輪數&統計 -->
        <el-popover placement="bottom" width="auto" trigger="click">
          <template #reference>
            <el-tag type="success" class="text-lg hover:cursor-pointer"
              >Round {{ learningStore.listening_round }} -
              {{ completedInRound }} / {{ totalInRound }}</el-tag
            >
          </template>

          <div class="sound-grid">
            <div
              v-for="(count, sound) in learningStore.listening_roundCounts"
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

        <div class="flex items-center gap-4 md:gap-8">
          <img
            src="/images/arrow-circle-left-solid.svg"
            alt="上一個"
            class="h-10 w-10 cursor-pointer md:h-8 md:w-8"
            @click="changeSound('prev')"
          />
          <img
            src="/images/arrow-circle-right-solid.svg"
            alt="下一個"
            class="h-10 w-10 cursor-pointer md:h-8 md:w-8"
            @click="changeSound('next')"
          />
        </div>
      </div>

      <div class="flex items-center justify-end">
        <!-- 特別學習列表 -->
        <el-badge
          :value="learningStore.listening_specialLearningList.length"
          class="mr-2"
        >
          <el-button
            @click="specialLearningListDialogVisible = true"
            type="primary"
            link
            title="特別學習列表"
          >
            <el-icon :size="30"><List /></el-icon>
          </el-button>
        </el-badge>

        <!-- 加入特別學習 -->
        <el-button
          @click="addSpecialLearning"
          type="primary"
          link
          title="加入特別學習"
        >
          <el-icon :size="30"><CirclePlusFilled /></el-icon>
        </el-button>

        <!-- AI辨識 -->
        <el-button
          v-if="authStore.isLoggedIn"
          id="ai-recognition-button"
          @click="handwritingCanvas.handleAIRecognition()"
          class="tech-gradient-button h-12 w-full text-[18px]"
          :disabled="loading"
        >
          {{ t("ai_recognition") }}
          <img
            class="ml-2 h-6 w-6"
            :class="{ 'animate-spin': loading }"
            src="/images/stars.png"
            alt=""
          />
        </el-button>
        <el-button v-else type="primary" class="h-12 w-full" disabled>
          {{ t("login_to_enable_ai_recognition") }}
        </el-button>
      </div>

      <!-- 顯示答案 -->
      <el-tag
        class="hover:cursor-pointer"
        @click="showCurrentWord = !showCurrentWord"
        type="danger"
      >
        {{ showCurrentWord ? t("hide_answer") : t("show_answer") }}
      </el-tag>

      <div v-if="showCurrentWord" class="rounded-lg bg-gray-100 p-4">
        <div class="flex justify-between md:flex-col">
          <p>
            <strong>{{ t("japanese") }}：</strong
            >{{ learningStore.listening_selectedSound.kana }}
          </p>
          <p>
            <strong>{{ t("romaji") }}：</strong
            >{{ learningStore.listening_selectedSound.romaji }}
          </p>
          <p>
            <strong>{{ t("kanji_source") }}：</strong
            >{{ learningStore.listening_selectedSound.evo }}
          </p>
        </div>
      </div>
    </div>
    <!-- 右側手寫區 -->
    <div class="w-full content-center select-none">
      <el-card>
        <HandwritingCanvas
          ref="handwritingCanvas"
          @image-recognition="imageRecognition"
          :example-kana="learningStore.listening_selectedSound.kana"
          :show-example="false"
          :current-type="learningStore.listening_tab"
          :learning-module="'listening'"
          :show-change-sound-buttons="false"
          :selected-sound="learningStore.listening_selectedSound"
        />
      </el-card>
    </div>

    <!-- Special Learning List Dialog -->
    <el-dialog
      v-model="specialLearningListDialogVisible"
      class="w-[90vw] max-w-[500px]"
    >
      <template #header>
        <div class="items center flex justify-between">
          <span>{{ t("special_learning_list") }}</span>
          <el-button
            @click="handleClearSpecialLearningList"
            link
            style="font-size: 35px; padding: 0; margin: 0; line-height: 1"
          >
            <img
              src="/images/broom.png"
              alt=""
              class="h-10 w-10 cursor-pointer"
              :class="{ 'rotate-animation': isRotating }"
            />
          </el-button>
        </div>
      </template>

      <div v-if="learningStore.listening_specialLearningList.length === 0">
        {{ t("no_special_learning_words") }}
      </div>
      <div class="max-h-[70vh] overflow-auto" v-else>
        <div
          v-for="(item, index) in learningStore.listening_specialLearningList"
          :key="index"
          class="mt-2 flex items-center justify-between"
        >
          <span>{{ t(item.type) }} - {{ item.kana }}</span>
          <el-button type="danger" @click="handleRemoveSpecialLearning(index)"
            ><el-icon><Delete /></el-icon
          ></el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, watch, nextTick } from "vue";
import { ElMessageBox, ElMessage } from "element-plus";
import { Delete, List, CirclePlusFilled } from "@element-plus/icons-vue";
import HandwritingCanvas from "@/components/HandwritingCanvas.vue";
import fiftySoundsData from "@/data/fifty-sounds.json";

/*-- i18n --*/
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

/*-- API --*/
import { useApi } from "@/composables/useApi.js";
const MYAPI = useApi();

/*-- store --*/
import { useAuthStore, useLearningStore } from "@/stores/index.js";
const authStore = useAuthStore();
const learningStore = useLearningStore();

// 使用 Web Audio API 進行音頻管理
import { useWebAudio } from "@/composables/useWebAudio.js";
const { isPlaying, play: playAudio, stop: stopAudio } = useWebAudio();

const TAB_TYPES = {
  HIRAGANA: "hiragana",
  KATAKANA: "katakana",
  DAKUON: "dakuon",
  HANDAKUON: "handakuon",
  YOON: "yoon",
};

// 單前單字集
const currentCharSet = computed(() => {
  if (learningStore.listening_tab === "special") {
    return learningStore.listening_specialLearningList;
  }
  return fiftySounds[learningStore.listening_tab] ?? [];
});

const totalInRound = computed(
  () => currentCharSet.value.filter((sound) => sound.kana).length,
);

const completedInRound = computed(
  () =>
    currentCharSet.value.filter(
      (sound) =>
        sound.kana &&
        learningStore.listening_roundCounts[sound.kana] >=
          learningStore.listening_round,
    ).length,
);

const fiftySounds = fiftySoundsData;
const handwritingCanvas = ref(null);
const showCurrentWord = ref(false);
const specialLearningListDialogVisible = ref(false);
const predictKana = ref("");
const isRotating = ref(false);
const loading = ref(false);

// 標記是否正在掛載中
const isMounting = ref(true);

// 切換單字集時重置輪數與計數
watch(currentCharSet, () => {
  initializeCounts(true);
  learningStore.listening_round = 1;
});

// 監聽切換單字並撥放聲音
watch(
  () => learningStore.listening_selectedSound,
  async (newSound, oldSound) => {
    // 掛載期間不自動播放，避免重複播放
    if (newSound !== oldSound && !isMounting.value) {
      await nextTick();
      await playSound();
    }
  },
);

// 初始化每輪記數
const checkCounts = () => {
  const isEmpty = Object.keys(learningStore.listening_roundCounts).length === 0;
  if (isEmpty) {
    currentCharSet.value.forEach((sound) => {
      if (sound.kana) {
        learningStore.listening_roundCounts[sound.kana] = 0;
      }
    });
  }
};

const initializeCounts = (resetCounts = false) => {
  Object.keys(learningStore.listening_roundCounts).forEach(
    (key) => delete learningStore.listening_roundCounts[key],
  );

  currentCharSet.value.forEach((sound) => {
    if (sound.kana) {
      learningStore.listening_roundCounts[sound.kana] = 0;
    }
  });
};

// Event: 切換字符集
const handleTabChange = () => {
  learningStore.listening_selectedSound = currentCharSet.value[0];
  initializeCounts(true);
};

// Event: 切換模式
const handleModeChange = () => {
  ElMessage.success(
    learningStore.listening_mode
      ? t("switch_to_random")
      : t("switch_to_sequential"),
  );
};

// Click: 播放單字發音
const togglePlay = async () => {
  await playSound();
};

// 循序尋找下一個單字
const findNextChar = (currentIndex, direction) => {
  const totalItems = currentCharSet.value.length;
  let nextIndex = currentIndex;
  let loopCount = 0;

  while (loopCount < totalItems) {
    nextIndex = (nextIndex + direction + totalItems) % totalItems;
    if (currentCharSet.value[nextIndex].kana) {
      return currentCharSet.value[nextIndex];
    }
    loopCount++;
  }

  return null;
};

// 隨機尋找下一個單字
const findNextRandomChar = () => {
  const validSounds = currentCharSet.value.filter((sound) => sound.kana);
  const availableSounds = validSounds.filter(
    (sound) =>
      learningStore.listening_roundCounts[sound.kana] <
      learningStore.listening_round,
  );

  if (availableSounds.length === 0) {
    // 所有音都已經出現了，開始新的一輪
    learningStore.listening_round++;
    return findNextRandomChar(); // 遞迴調用以獲取新一輪的聲音
  }

  const randomIndex = Math.floor(Math.random() * availableSounds.length);
  const nextSound = availableSounds[randomIndex];
  return nextSound;
};

// 切換單字
const changeSound = (type) => {
  if (learningStore.listening_mode) {
    learningStore.listening_selectedSound = findNextRandomChar();
  } else {
    const currentIndex = currentCharSet.value.findIndex(
      (sound) => sound.kana === learningStore.listening_selectedSound.kana,
    );

    const nextSound =
      type === "next"
        ? findNextChar(currentIndex, 1)
        : findNextChar(currentIndex, -1);

    learningStore.listening_selectedSound = nextSound;
  }
};

// 撥放發音
const playSound = async () => {
  const audioUrl = `/sounds/${learningStore.listening_selectedSound.romaji}.mp3`;
  await playAudio(audioUrl);
};

/*-- Special Learning --*/
const addSpecialLearning = () => {
  if (!learningStore.listening_selectedSound) return;
  const isExist = learningStore.listening_specialLearningList.some(
    (item) => item.kana === learningStore.listening_selectedSound.kana,
  );
  if (isExist) {
    ElMessage.info(t("already_in_special_learning"));
    return;
  }
  learningStore.listening_specialLearningList.push(
    learningStore.listening_selectedSound,
  );
  ElMessage.success(t("add_to_special_learning_success"));
};

const handleSpecialLearning = () => {
  if (learningStore.listening_specialLearningList.length === 0) {
    ElMessage.warning(t("special_learning_list_empty"));
    return;
  }
  learningStore.listening_tab = "special";
  ElMessage.success(t("start_special_learning"));
};

const handleRemoveSpecialLearning = (index) => {
  learningStore.listening_specialLearningList.splice(index, 1);

  // 如果 specialLearningList 被清空, 自動跳到平假名練習集
  if (
    learningStore.listening_tab === "special" &&
    learningStore.listening_specialLearningList.length === 0
  ) {
    learningStore.listening_tab = TAB_TYPES.HIRAGANA;
    specialLearningListDialogVisible.value = false;
    handleTabChange();
  }
};

const handleClearSpecialLearningList = () => {
  ElMessageBox.confirm(t("clear_special_learning_list_confirm"), t("warning"), {
    confirmButtonText: t("confirm"),
    cancelButtonText: t("cancel"),
    type: "warning",
  })
    .then(() => {
      isRotating.value = true;

      setTimeout(() => {
        learningStore.listening_specialLearningList = [];
        // saveSpecialLearningList();
        ElMessage.success(t("special_learning_list_cleared"));

        // 如果 specialLearningList 被清空, 自動跳到平假名練習集
        if (learningStore.listening_tab === "special") {
          learningStore.listening_tab = TAB_TYPES.HIRAGANA;
          handleTabChange();
        }

        specialLearningListDialogVisible.value = false;
        isRotating.value = false;
      }, 500);
    })
    .catch(() => {
      ElMessage.info(t("cancelled"));
    });
};

/*-- 影像辨識 --*/
const imageRecognition = async (imageBlob) => {
  loading.value = true;
  try {
    const formData = new FormData();
    formData.append("char_type", learningStore.listening_selectedSound.type);
    formData.append("image", imageBlob, "handwriting.png");
    formData.append(
      "learning_item",
      learningStore.listening_selectedSound.kana,
    );
    const predict_res = await MYAPI.post("/predict", formData);

    if (predict_res === "ERR_NETWORK") {
      ElMessage.error(t("network_error"));
      return;
    } else if (predict_res === "ERR_SERVER") {
      ElMessage.error(t("server_error"));
      return;
    }

    if (predict_res.status == "error") {
      ElMessage.error(predict_res["message"] ?? "伺服器錯誤");
      return;
    }

    const { predicted_char, correctness } = predict_res.data;
    const currentKana = learningStore.listening_selectedSound.kana;

    // 更新辨識結果
    predictKana.value = predicted_char;
    if (correctness) {
      predictKana.value = currentKana;
      ElMessage.success(t("corrent") + `！: ${currentKana}`);
      learningStore.listening_roundCounts[currentKana]++;
      changeSound("next");
    } else {
      ElMessage.error(t("incorrect") + `！: ${predicted_char}`);
    }
  } catch (error) {}
  loading.value = false;
};

onMounted(() => {
  checkCounts();

  // 掛載完成後解除掛載標記並播放聲音
  nextTick(() => {
    isMounting.value = false;
    playSound();
  });
});
</script>

<style scoped>
.tech-gradient-button {
  background: linear-gradient(45deg, #6a11cb 0%, #2575fc 100%) !important;
  color: white !important;
  border: none;
  transition:
    transform 0.2s ease-in-out,
    box-shadow 0.3s ease;
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
  width: max-content;
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

.rotate-animation {
  animation: rotate 0.5s linear;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>

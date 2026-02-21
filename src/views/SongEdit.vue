<template>
  <div class="flex flex-col sm:h-[85vh] sm:overflow-hidden">
    <div
      class="flex h-full flex-col gap-2 px-4 py-4 sm:flex-row sm:px-10"
      ref="containerRef"
    >
      <!-- 左側面板: 影片播放器+功能列 -->
      <div
        class="flex flex-col gap-2"
        :style="{ width: isMobile ? '100%' : `${leftPanelWidth}%` }"
      >
        <!-- 第一列: 獲取YT影片 -->
        <div class="flex">
          <el-input v-model="videoId" class="w-full" placeholder="輸入YT ID" />
          <el-button type="primary" plain @click="handleReloadYT">
            載入影片
          </el-button>
          <el-button type="primary" @click="openSearchDialog">
            搜尋影片
          </el-button>
          <el-button class="grow" type="success" @click="handlePublishSong">
            發布歌曲
          </el-button>
        </div>

        <!-- 第二列 歌名 -->
        <div class="flex gap-2">
          <el-input
            v-model="videoTitle"
            class="w-full"
            placeholder="輸入歌名"
          />
        </div>

        <!-- 第三列 歌手 -->
        <div class="flex gap-2">
          <el-input
            v-model="videoChannel"
            class="w-full"
            placeholder="輸入歌手名稱"
          />
        </div>

        <!-- 第四列 標籤 -->
        <div class="flex gap-2">
          <el-input v-model="tag" class="w-full" placeholder="輸入標籤" />
        </div>

        <!-- 第五列: 功能列 -->
        <div class="flex gap-2">
          <el-button type="info" plain @click="handleClearLyrics" class="flex-1"
            >清空</el-button
          >

          <el-button
            class="flex-1"
            type="primary"
            plain
            @click="handleLyricsDialogOpen"
          >
            貼上歌詞
          </el-button>
          <el-button
            class="flex-1"
            type="primary"
            plain
            @click="convertedLyricsDialogVisible = true"
          >
            貼上轉換歌詞
          </el-button>
        </div>

        <!-- 第六列: 功能列 -->
        <div class="flex gap-2">
          <el-button
            class="flex-1"
            type="warning"
            plain
            @click="handleClearTime"
          >
            清空時間部分
          </el-button>
          <el-button class="flex-1" type="warning" plain @click="handleCopy">
            複製歌詞
          </el-button>
          <el-button
            class="flex-1"
            type="warning"
            plain
            @click="handleCopyHiragana"
          >
            複製轉換歌詞
          </el-button>
        </div>

        <!-- 第七列: 時間控制 -->
        <div class="flex gap-2">
          <el-input
            v-model="timeDiff"
            class="w-full"
            placeholder="輸入時間差"
          ></el-input>
          <el-button type="primary" plain @click="handleBulkTimeDiff('minus')"
            >減時</el-button
          >
          <el-button type="info" plain @click="handleBulkTimeDiff('add')"
            >加時</el-button
          >
        </div>

        <!-- 第八列: 功能列 -->
        <div class="flex w-full items-center gap-2">
          <el-checkbox v-model="autoScroll">scrolling</el-checkbox>
          <el-input-number
            v-model="playbackRate"
            :precision="1"
            :step="0.1"
            :max="2"
            :min="0.3"
            @change="changePlaybackRate(playbackRate)"
          />
          <el-checkbox v-model="formData.is_public">publish</el-checkbox>
        </div>

        <!-- 功能列 -->
        <div class="flex h-[10%] flex-col gap-2">
          <!-- 第一列 -->
          <!-- 影片播放器 -->
          <div id="player-container" ref="playerContainerRef" class="h-fit">
            <div
              id="player"
              ref="playerRef"
              style="max-height: 430px; aspect-ratio: 4/3"
            ></div>
          </div>

          <!-- 第二列 -->
          <div class="w-full">
            <el-space wrap>
              <el-tag type="info"> a - 往前3秒</el-tag>
              <el-tag type="info"> s - 暫停/開始</el-tag>
              <el-tag type="info"> d - 往後3秒</el-tag>
              <el-tag type="info"> enter - 紀錄時間</el-tag>
            </el-space>
          </div>
        </div>
      </div>

      <!-- 可拖動的分隔線 -->
      <div
        v-if="!isMobile"
        class="resizer"
        :class="{ 'resizer-dragging': isDragging }"
        @mousedown="handleMouseDown"
      ></div>

      <!-- 右側面板: 歌詞 -->
      <el-scrollbar
        class="lyrics-container h-full overflow-x-auto"
        :style="{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }"
        v-loading="lyricsLoading"
      >
        <div class="">
          <div
            v-for="(line, index) in allLyrics"
            :key="index"
            :id="`lyric-${index}`"
            :class="{ 'bg-yellow-100': currentLyricIndex === index }"
            class="flex items-center gap-4 py-4"
            style="border-block-width: 6px; border-block-color: #e5e7eb"
          >
            <div class="flex flex-shrink-0 flex-col items-center">
              <div class="flex">
                <el-button link plain @click="startVideoOn(line.timestamp)">
                  <el-icon :size="25">
                    <Switch />
                  </el-icon>
                </el-button>

                <el-button link plain @click="handleDelete(index)">
                  <el-icon :size="25" color="red">
                    <Delete />
                  </el-icon>
                </el-button>

                <el-button
                  link
                  class="text-sm text-blue-500"
                  @click="handleAddNewLyricLine(index)"
                >
                  <el-icon :size="25" color="blue">
                    <Plus />
                  </el-icon>
                </el-button>

                <el-button
                  link
                  class="text-sm text-blue-500"
                  @click="handleDuplicateLyricLine(index)"
                >
                  <el-icon :size="25" color="blue">
                    <CopyDocument />
                  </el-icon>
                </el-button>
              </div>

              <input
                v-model="line.timestamp"
                class="h-6 w-28 cursor-auto rounded border border-gray-300 px-1"
                placeholder="輸入時間"
              />

              <div class="flex">
                <el-button link @click="handleDecreaseTime(index, 5)">
                  -5
                </el-button>
                <el-button link @click="handleDecreaseTime(index, 10)">
                  -10
                </el-button>
                <el-button link @click="handleIncreaseTime(index, 5)">
                  +5
                </el-button>
                <el-button link @click="handleIncreaseTime(index, 10)">
                  +10
                </el-button>
              </div>
            </div>
            <div class="flex w-full flex-wrap items-center gap-2">
              <template v-for="(ly, lyIndex) in line.lyrics" :key="lyIndex">
                <div
                  class="flex w-28 flex-col"
                  :id="`lyric-cvt-${index}-${lyIndex}`"
                >
                  <span class="flex">
                    <el-button
                      class="text-sm text-yellow-500"
                      @click="handleDoubleClick(index, lyIndex, ly.ori)"
                      type="text"
                    >
                      推
                    </el-button>
                    <el-button
                      class="text-sm text-blue-500"
                      @click="handleWidthenLyric(index, lyIndex)"
                      type="text"
                    >
                      寬
                    </el-button>
                    <el-button
                      class="text-sm text-red-500"
                      @click="handleDeleteLyric(index, lyIndex)"
                      type="text"
                    >
                      刪
                    </el-button>
                    <el-button
                      class="text-sm text-yellow-800"
                      @click="handleAddLyric(index, lyIndex)"
                      type="text"
                    >
                      增
                    </el-button>
                  </span>
                  <input
                    v-model="ly.cvt"
                    class="lyric-cvt h-6 w-full rounded border border-gray-300 px-1"
                    placeholder=""
                  />

                  <el-popover
                    placement="bottom"
                    title="推薦假名"
                    :width="200"
                    trigger="manual"
                    :visible="isPopoverVisible(index, lyIndex)"
                    @update:visible="(val) => !val && closePopover()"
                  >
                    <template #reference>
                      <input
                        v-model="ly.ori"
                        class="lyric-ori h-6 w-full cursor-pointer rounded border border-gray-300 p-2"
                        placeholder=""
                      />
                    </template>

                    <div v-loading="recommendLoading" class="flex flex-col">
                      <template
                        v-for="(hiragana, hIndex) in recommendHiraganas"
                        :key="hIndex"
                      >
                        <div
                          @click="
                            ly.cvt = hiragana;
                            closePopover();
                          "
                          class="w-full cursor-pointer p-1 text-center text-blue-400 hover:text-blue-600"
                        >
                          {{ hiragana }}
                        </div>
                      </template>
                    </div>
                  </el-popover>

                  <input
                    v-model="ly.color"
                    class="lyric-cvt h-6 w-full rounded border border-gray-300 px-1"
                    placeholder=""
                  />

                  <!-- Color indicator button -->
                  <div class="mt-1 flex items-center gap-1">
                    <el-button
                      size="small"
                      @click="openColorPicker(index, lyIndex)"
                      :style="
                        ly.color
                          ? { backgroundColor: ly.color, borderColor: ly.color }
                          : {}
                      "
                      class="h-6 w-8 p-0"
                      :class="ly.color ? '' : 'bg-gray-200'"
                      title="設定顏色"
                    >
                      <span class="text-xs">色</span>
                    </el-button>
                    <el-button
                      size="small"
                      class="h-6 w-8 p-0 text-white"
                      style="background-color: #9b59b6; border-color: #9b59b6"
                      title="套用紫色"
                      @click="ly.color = '#9B59B6'"
                    >
                      <span class="text-xs">紫</span>
                    </el-button>
                    <el-button
                      size="small"
                      class="h-6 w-8 p-0 text-white"
                      style="background-color: #fa8072; border-color: #fa8072"
                      title="套用鮭魚色"
                      @click="ly.color = '#FA8072'"
                    >
                      <span class="text-xs">鮭</span>
                    </el-button>
                    <el-button
                      v-if="ly.color"
                      link
                      size="small"
                      class="text-xs text-gray-500"
                      @click="ly.color = ''"
                      type="text"
                    >
                      X
                    </el-button>
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 歌詞貼上 Dialog -->
    <el-dialog title="貼上原始歌詞" v-model="lyricsDialogVisible" width="80%">
      <div v-loading="lyricsLoading">
        <el-input v-model="originalLyrics" type="textarea" rows="10" />
        <div class="mt-4 flex justify-end gap-4">
          <el-button @click="handleLyricsDialogClose">取消</el-button>
          <el-button type="primary" @click="handleLyricsDialogSubmit"
            >貼上</el-button
          >
        </div>
      </div>
    </el-dialog>

    <!-- 轉換歌詞貼上 Dialog -->
    <el-dialog
      title="貼上轉換歌詞"
      v-model="convertedLyricsDialogVisible"
      width="80%"
    >
      <div>
        <el-input v-model="convertedLyrics" type="textarea" rows="10" />
        <div class="mt-4 flex justify-end gap-4">
          <el-button type="primary" @click="convertedLyricsDialogSubmit"
            >貼上</el-button
          >
        </div>
      </div>
    </el-dialog>

    <!-- YouTube 搜尋 Dialog -->
    <el-dialog
      title="搜尋 YouTube 影片"
      v-model="searchDialogVisible"
      width="90%"
      top="5vh"
    >
      <div class="h-[75vh]">
        <div class="mb-4 flex h-[7%] gap-2">
          <el-input v-model="searchQuery" placeholder="輸入搜尋關鍵字" />
          <el-button type="primary" @click="searchYouTube">搜尋</el-button>
        </div>

        <div class="h-[90%] overflow-y-auto">
          <el-list v-if="searchResults.length > 0">
            <template v-for="item in searchResults" :key="item.id.videoId">
              <el-list-item>
                <div class="flex items-center gap-4">
                  <el-image
                    :src="item.snippet.thumbnails.high.url"
                    :alt="item.snippet.title"
                    style="width: 40%; height: auto; object-fit: cover"
                    class="shrink-0"
                  />
                  <div class="flex flex-col gap-2" style="width: 60%">
                    <p class="font-medium">{{ item.snippet.title }}</p>
                    <p class="text-gray-500">{{ item.snippet.channelTitle }}</p>
                    <el-button
                      class="w-full"
                      type="success"
                      size="small"
                      @click="selectVideo(item)"
                    >
                      選擇
                    </el-button>
                  </div>
                </div>
              </el-list-item>
              <el-divider />
            </template>
          </el-list>
          <div v-else-if="loading">載入中...</div>
          <div v-else>找不到相關影片</div>
        </div>
      </div>
    </el-dialog>

    <!-- 共用的顏色選擇 Dialog -->
    <el-dialog title="選擇顏色" v-model="colorPickerVisible" width="300px">
      <div class="flex flex-col gap-4">
        <div class="flex items-center justify-center">
          <input
            type="color"
            v-model="selectedColor"
            class="h-32 w-32 cursor-pointer rounded border border-gray-300"
          />
        </div>
        <div class="text-center text-gray-600">
          當前顏色: {{ selectedColor || "未設定" }}
        </div>
        <div class="flex justify-end gap-2">
          <el-button @click="colorPickerVisible = false">取消</el-button>
          <el-button type="primary" @click="applyColor">確定</el-button>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import { Delete, Switch, Plus, CopyDocument } from "@element-plus/icons-vue";
import { ElMessage, ElMessageBox } from "element-plus";
import axios from "axios";

import { useApi } from "@/composables/useApi.js";

import { useRoute } from "vue-router";
const route = useRoute();

const MYAPI = useApi();

const isDirty = ref(false);
const autoScroll = ref(false);
const playbackRate = ref(1);

// 影片資訊
const videoId = ref("");
const videoTitle = ref("");
const videoChannel = ref("");
const tag = ref("");

// YouTube Player
const playerRef = ref(null);
let player = null;
const isPlaying = ref(false);

// 歌詞
const lyricsLoading = ref(false);
const allLyrics = ref([]);
const currentLyricIndex = ref(-1);

// 歌詞貼上 Dialog
const lyricsDialogVisible = ref(false);
const originalLyrics = ref("");

// 轉換歌詞 Dialog
const convertedLyricsDialogVisible = ref(false);
const convertedLyrics = ref("");

// YouTube 搜尋 Dialog
const searchDialogVisible = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const loading = ref(false);
const nextPageToken = ref(false);

// 推薦假名 Dialog
const recommendQuery = ref("");
const recommendLoading = ref(false);
const recommendHiraganas = ref([]);
const currentOpenPopover = ref({ lineIndex: -1, lyricIndex: -1 });
const hiraganaCache = ref(new Map());
const CACHE_MAX_SIZE = 10;

// 顏色選擇 Dialog
const colorPickerVisible = ref(false);
const selectedColor = ref("");
const currentColorLyricIndex = ref(-1);
const currentColorLyricLineIndex = ref(-1);

// YouTube API 金鑰
const apiKey = ref("");

// 時間差
const timeDiff = ref("00:00.10");

// Resizer相關
const containerRef = ref(null);
const leftPanelWidth = ref(33); // 左側面板寬度百分比
const isDragging = ref(false);
const isMobile = ref(false);

// 發布歌曲相關
const formData = ref({
  id: "",
  source_id: "",
  name: "",
  artist: "",
  tags: "",
  is_public: true,
  original: "",
  converted: "",
});

// 轉換時間字串為秒
const parseTimeToSeconds = (timeString) => {
  // convert '[mm:ss.ms]'  to seconds
  if (!timeString) return 0;
  const timeStringmatch = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (timeStringmatch) {
    const minutes = parseInt(timeStringmatch[1]);
    const seconds = parseFloat(timeStringmatch[2]);
    return minutes * 60 + seconds;
  }
  return 0;
};

// 複製到剪貼簿
const handleCopyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  ElMessage.success("複製成功");
};

//-- 歌詞Dialog相關 --//
const handleLyricsDialogOpen = () => {
  lyricsDialogVisible.value = true;
};

const handleLyricsDialogClose = () => {
  lyricsDialogVisible.value = false;
};

const handleLyricsDialogSubmit = async () => {
  // 透過伺服器轉換歌詞
  lyricsLoading.value = true;
  try {
    const response = await MYAPI.post("/convert_lyrics", {
      lyrics: originalLyrics.value,
    });
    if (response.status == "success") {
      ElMessage.success("歌詞轉換成功");
      allLyrics.value = response.data;
    } else {
      ElMessage.error(response.message);
      return;
    }
  } catch (error) {
    console.error("轉換歌詞時發生錯誤：", error);
    ElMessage.error("轉換歌詞時發生錯誤");
  } finally {
    lyricsLoading.value = false;
  }
  lyricsDialogVisible.value = false;
};

// 將貼上的json格式的歌詞轉換為所需格式
const convertedLyricsDialogSubmit = async () => {
  allLyrics.value = JSON.parse(convertedLyrics.value);
  convertedLyricsDialogVisible.value = false;
};

//-- 插入歌詞相關 --//

const handleClearLyrics = () => {
  allLyrics.value = [];
};

const handleClearTime = () => {
  allLyrics.value.forEach((line) => {
    line.timestamp = "";
  });
  ElMessage.success("已清空所有時間戳記");
};

const handleInsert = () => {
  if (window.player) {
    const currentTime = window.player.getCurrentTime();
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100);
    const formattedTime = `[${String(minutes).padStart(2, "0")}:${String(
      seconds,
    ).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}]`;

    // 尋找最前面的空位
    const emptyIndex = allLyrics.value.findIndex(
      (line) => line.timestamp === "" || line.timestamp === null,
    );
    if (emptyIndex !== -1) {
      allLyrics.value[emptyIndex].timestamp = formattedTime;
    } else {
      allLyrics.value.push({ timestamp: formattedTime, lyrics: "" });
    }

    nextTick(() => {
      scrollToCurrentLyric(
        emptyIndex !== -1 ? emptyIndex : allLyrics.value.length - 1,
      );
    });
  } else {
    console.error("YouTube player is not ready yet.");
  }
};

//-- 刪除歌詞相關 --//
const handleDelete = (index) => {
  allLyrics.value.splice(index, 1);
};

const handleWidthenLyric = (lyricIndex, lyricLineIndex) => {
  // 找出指定 input 元素 並增加 50px
  const input = document.querySelector(
    `#lyric-cvt-${lyricIndex}-${lyricLineIndex}`,
  );
  if (input) {
    let originWidth = input.style.width;
    if (originWidth == "") {
      input.style.width = "162px";
    } else {
      // 擷取數字部分
      const num = parseInt(originWidth.replace("px", ""));
      input.style.width = num + 50 + "px";
    }
  }
};

const handleDeleteLyric = (lyricIndex, lyricLineIndex) => {
  allLyrics.value[lyricIndex].lyrics.splice(lyricLineIndex, 1);
};

const handleAddLyric = (lyricIndex, lyricLineIndex) => {
  // 在指定位置增加一個空的 lyric
  allLyrics.value[lyricIndex].lyrics.splice(lyricLineIndex + 1, 0, {
    cvt: "",
    ori: "",
    color: "",
  });
};

const handleAddNewLyricLine = (lyricIndex) => {
  // 在指定位置增加一個空的 lyric line
  allLyrics.value.splice(lyricIndex + 1, 0, {
    timestamp: "",
    lyrics: [{ cvt: "", ori: "", color: "" }],
  });
};

const handleDuplicateLyricLine = (lyricIndex) => {
  const lineToDuplicate = allLyrics.value[lyricIndex];
  const duplicatedLine = JSON.parse(JSON.stringify(lineToDuplicate));
  allLyrics.value.splice(lyricIndex + 1, 0, duplicatedLine);
};

//-- 複製歌詞 --//

const combinedLyric = () => {
  let result = [];
  for (const line of allLyrics.value) {
    if (line.lyrics.length === 0) continue;
    let combinedLyric = "";
    for (const lyric of line.lyrics) {
      combinedLyric += `${lyric.ori}`;
    }
    result.push(`${line.timestamp}${combinedLyric}`);
  }
  return result.join("\n");
};

const handleCopy = () => {
  navigator.clipboard.writeText(combinedLyric());
  ElMessage.success("複製成功");
};

function customStringify(obj) {
  return (
    JSON.stringify(obj, null, 2)
      // 處理 lyrics 內部的物件格式（含顏色）
      .replace(
        /{\s*"cvt":\s*"([^"]*)",\s*"ori":\s*"([^"]*)",\s*"color":\s*"([^"]*)"\s*}/g,
        '{"cvt": "$1","ori": "$2","color": "$3"}',
      )
      // 處理 lyrics 內部的物件格式（不含顏色）
      .replace(
        /{\s*"cvt":\s*"([^"]*)",\s*"ori":\s*"([^"]*)"\s*}/g,
        '{"cvt": "$1","ori": "$2"}',
      )
      // 修正最後一個逗號後的換行
      .replace(/},\s+]/g, "},\n  ]")
  );
}

const handleCopyHiragana = () => {
  let result = [];
  for (const line of allLyrics.value) {
    if (line.lyrics.length === 0) continue;
    let combinedLyric = "[";
    for (const lyric of line.lyrics) {
      // 如果有顏色，就包含顏色信息
      if (lyric.color) {
        combinedLyric += `{"cvt": "${lyric.cvt}","ori": "${lyric.ori}","color": "${lyric.color}"},`;
      } else {
        combinedLyric += `{"cvt": "${lyric.cvt}","ori": "${lyric.ori}"},`;
      }
    }
    combinedLyric = combinedLyric.slice(0, -1);
    combinedLyric += "]";
    result.push({
      timestamp: line.timestamp,
      lyrics: JSON.parse(combinedLyric),
    });
  }
  navigator.clipboard.writeText(customStringify(result));
  ElMessage.success("複製成功");
};

//-- 推薦假名相關 --//
const handleRecommendHiragana = async (text) => {
  if (!text) return;

  // Check cache first
  if (hiraganaCache.value.has(text)) {
    const cachedValue = hiraganaCache.value.get(text);
    recommendHiraganas.value = cachedValue;
    // Move the accessed item to the end to mark it as recently used
    hiraganaCache.value.delete(text);
    hiraganaCache.value.set(text, cachedValue);
    return;
  }

  if (text === recommendQuery.value) return;

  recommendHiraganas.value = [];
  recommendLoading.value = true;
  recommendQuery.value = text;
  try {
    const response = await MYAPI.get("gemini_recommend_hiragana", {
      text,
    });
    recommendHiraganas.value = response.data;

    // Store in cache
    hiraganaCache.value.set(text, response.data);

    // Evict oldest item if cache is full
    if (hiraganaCache.value.size > CACHE_MAX_SIZE) {
      const oldestKey = hiraganaCache.value.keys().next().value;
      hiraganaCache.value.delete(oldestKey);
    }
  } catch (error) {
    ElMessage.error("獲取推薦假名失敗");
  } finally {
    recommendLoading.value = false;
  }
};

// 處理雙擊事件開啟推薦假名
const handleDoubleClick = (lineIndex, lyricIndex, text) => {
  currentOpenPopover.value = { lineIndex, lyricIndex };
  handleRecommendHiragana(text);
};

// 檢查特定 popover 是否應該顯示
const isPopoverVisible = (lineIndex, lyricIndex) => {
  return (
    currentOpenPopover.value.lineIndex === lineIndex &&
    currentOpenPopover.value.lyricIndex === lyricIndex
  );
};

// 關閉 popover
const closePopover = () => {
  currentOpenPopover.value = { lineIndex: -1, lyricIndex: -1 };
};

//-- 顏色選擇相關 --//
const openColorPicker = (lyricIndex, lyricLineIndex) => {
  currentColorLyricIndex.value = lyricIndex;
  currentColorLyricLineIndex.value = lyricLineIndex;
  // 設定當前顏色到選擇器
  const currentLyric = allLyrics.value[lyricIndex]?.lyrics[lyricLineIndex];
  selectedColor.value = currentLyric?.color || "#000000";
  colorPickerVisible.value = true;
};

const applyColor = () => {
  if (
    currentColorLyricIndex.value >= 0 &&
    currentColorLyricLineIndex.value >= 0 &&
    allLyrics.value[currentColorLyricIndex.value]?.lyrics[
      currentColorLyricLineIndex.value
    ]
  ) {
    allLyrics.value[currentColorLyricIndex.value].lyrics[
      currentColorLyricLineIndex.value
    ].color = selectedColor.value;
    ElMessage.success("顏色設定成功");
  }
  colorPickerVisible.value = false;
};

//-- 處理按鍵事件 --//
const handleKeyPress = (event) => {
  switch (event.key.toLowerCase()) {
    case "enter":
      handleInsert();
      break;
    case "a":
      handleYTBack(3);
      break;
    case "s":
      handleYTStopStart();
      break;
    case "d":
      handleYTForward(3);
      break;
  }
};

//-- YouTube 相關 --//

// 在指定時間軸開始播放
const startVideoOn = (time2) => {
  if (player) {
    player.seekTo(parseTimeToSeconds(time2));
    player.playVideo();
  }
};

// 重新載入 YouTube
const handleReloadYT = () => {
  if (!videoId.value) return;

  if (player) {
    player.loadVideoById(videoId.value);
    player.playVideo();
  }
};

// 往後到指定時間
const handleYTBack = (seconds) => {
  if (player) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime - seconds, true);
  }
};

// 往前到指定時間
const handleYTForward = (seconds) => {
  if (player) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + seconds, true);
  }
};

// 暫停播放
const handleYTStopStart = () => {
  if (player) {
    if (isPlaying.value) {
      player.pauseVideo();
      isPlaying.value = false;
    } else {
      player.playVideo();
      isPlaying.value = true;
    }
  }
};

// YouTube API
const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = resolve;
    }
  });
};

// 滾動到指定歌詞
const scrollToCurrentLyric = (index) => {
  const lyricElement = document.getElementById(`lyric-${index}`);
  if (lyricElement) {
    lyricElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};

// 歌詞同步
const updateCurrentLyric = () => {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    for (let i = 0; i < allLyrics.value.length; i++) {
      const nextTime =
        i < allLyrics.value.length - 1
          ? parseTimeToSeconds(allLyrics.value[i + 1].timestamp)
          : Infinity;

      if (
        currentTime >= parseTimeToSeconds(allLyrics.value[i].timestamp) &&
        currentTime < nextTime
      ) {
        if (currentLyricIndex.value !== i) {
          currentLyricIndex.value = i;
          if (autoScroll.value) scrollToCurrentLyric(i);
        }
        break;
      }
    }
  }
};

//-- 初始化 YouTube Player --//
const initializePlayer = async () => {
  await loadYouTubeAPI();
  player = new YT.Player(playerRef.value, {
    videoId: videoId.value,
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      playsinline: 1,
    },
    events: {
      onReady: (event) => {
        setInterval(updateCurrentLyric, 100); // Check every 100ms
        event.target.setPlaybackRate(playbackRate.value);
        window.player = event.target;

        // 自動載入 YouTube 影片
        if (videoId.value) {
          handleReloadYT();
        }
      },
      onStateChange: (event) => {
        isPlaying.value = event.data === YT.PlayerState.PLAYING;

        if (event.data === YT.PlayerState.ENDED) {
          event.target.seekTo(0);
          event.target.playVideo();
        }
      },
    },
  });
};

//-- YouTube 搜尋 Dialog 相關 --//

// 打開 YouTube 搜尋 Dialog
const openSearchDialog = () => {
  searchDialogVisible.value = true;
};

// 關閉 YouTube 搜尋 Dialog
const closeSearchDialog = () => {
  searchDialogVisible.value = false;
};

// 搜尋 YouTube 影片
const searchYouTube = async () => {
  loading.value = true;
  searchResults.value = []; // 清空之前的搜尋結果
  nextPageToken.value = ""; // 重置分頁 token
  try {
    const { data } = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: 20,
          q: searchQuery.value,
          type: "video",
          key: apiKey.value,
        },
      },
    );
    searchResults.value = data.items;
    nextPageToken.value = data.nextPageToken || "";
  } catch (error) {
    console.error("搜尋 YouTube 影片時發生錯誤：", error);
    ElMessage.error("搜尋 YouTube 影片時發生錯誤");
  } finally {
    loading.value = false;
  }
};

// 選擇 YouTube 影片
const selectVideo = (videoItemFromSearch) => {
  videoId.value = videoItemFromSearch.id.videoId;
  videoTitle.value = videoItemFromSearch.snippet.title;
  videoChannel.value = videoItemFromSearch.snippet.channelTitle;
  closeSearchDialog();
  handleReloadYT();
};

const handleIncreaseTime = (index, milliseconds) => {
  // 確保索引有效
  if (index < 0 || index >= allLyrics.value.length) return;

  const line = allLyrics.value[index];
  const timestampPattern = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  const match = line.timestamp.match(timestampPattern);
  if (!match) return;

  // 解析時間戳
  const [_, minutes, seconds, ms] = match;
  const totalMs =
    parseInt(minutes) * 60 * 100 + parseInt(seconds) * 100 + parseInt(ms);

  // 加上指定的毫秒數
  let newTotalMs = totalMs + milliseconds;

  // 轉換回 mm:ss.ms 格式
  const newMinutes = Math.floor(newTotalMs / (60 * 100));
  const newSeconds = Math.floor((newTotalMs % (60 * 100)) / 100);
  const newMs = newTotalMs % 100;

  // 更新時間戳
  allLyrics.value[index].timestamp =
    `[${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(
      2,
      "0",
    )}.${String(newMs).padStart(2, "0")}]`;

  ElMessage.success(`時間戳增加 ${milliseconds} 毫秒`);
};

const handleDecreaseTime = (index, milliseconds) => {
  // 確保索引有效
  if (index < 0 || index >= allLyrics.value.length) return;

  const line = allLyrics.value[index];
  const timestampPattern = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
  const match = line.timestamp.match(timestampPattern);
  if (!match) return;

  // 解析時間戳
  const [_, minutes, seconds, ms] = match;
  const totalMs =
    parseInt(minutes) * 60 * 100 + parseInt(seconds) * 100 + parseInt(ms);

  // 減去指定的毫秒數
  let newTotalMs = totalMs - milliseconds;
  if (newTotalMs < 0) newTotalMs = 0;

  // 轉換回 mm:ss.ms 格式
  const newMinutes = Math.floor(newTotalMs / (60 * 100));
  const newSeconds = Math.floor((newTotalMs % (60 * 100)) / 100);
  const newMs = newTotalMs % 100;

  // 更新時間戳
  allLyrics.value[index].timestamp =
    `[${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(
      2,
      "0",
    )}.${String(newMs).padStart(2, "0")}]`;

  ElMessage.success(`時間戳減少 ${milliseconds} 毫秒`);
};

const changePlaybackRate = (value) => {
  if (player && player.setPlaybackRate) {
    player.setPlaybackRate(value);
  }
};

const handleBulkTimeDiff = (operator) => {
  // 解析時間差格式 (mm:ss.ms)
  const deltaPattern = /(\d{2}):(\d{2})\.(\d{2})/;
  const deltaMatch = timeDiff.value.match(deltaPattern);
  if (!deltaMatch) {
    ElMessage.error("時間差格式錯誤，請輸入 mm:ss.ms");
    return;
  }

  // 將時間差轉換為毫秒
  const [_, deltaMinutes, deltaSeconds, deltaMs] = deltaMatch;
  const deltaTotalMs =
    parseInt(deltaMinutes) * 60 * 100 +
    parseInt(deltaSeconds) * 100 +
    parseInt(deltaMs);

  // 處理每一行歌詞
  allLyrics.value = allLyrics.value.map((line) => {
    const timestampPattern = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
    const match = line.timestamp.match(timestampPattern);
    if (!match) return line;

    const [_, minutes, seconds, ms] = match;
    const totalMs =
      parseInt(minutes) * 60 * 100 + parseInt(seconds) * 100 + parseInt(ms);

    // 加上時間差
    let newTotalMs =
      totalMs + (operator === "add" ? deltaTotalMs : -deltaTotalMs);
    if (newTotalMs < 0) newTotalMs = 0;

    // 轉換回 mm:ss.ms 格式
    const newMinutes = Math.floor(newTotalMs / (60 * 100));
    const newSeconds = Math.floor((newTotalMs % (60 * 100)) / 100);
    const newMs = newTotalMs % 100;

    // 更新時間戳
    line.timestamp = `[${String(newMinutes).padStart(2, "0")}:${String(
      newSeconds,
    ).padStart(2, "0")}.${String(newMs).padStart(2, "0")}]`;
    return line;
  });

  ElMessage.success("時間調整完成");
};

const getApiKey = async () => {
  try {
    const response = await MYAPI.get("/get_yt_api_key");
    apiKey.value = response.data;
  } catch (error) {
    console.error("取得 API Key 時發生錯誤：", error);
    ElMessage.error("取得 API Key 時發生錯誤");
  }
};

//-- Resizer 相關 --//
// 檢測是否為移動設備
const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 640; // sm breakpoint
};

// 開始拖動
const handleMouseDown = (e) => {
  isDragging.value = true;
  e.preventDefault();
};

// 拖動中
const handleMouseMove = (e) => {
  if (!isDragging.value || !containerRef.value) return;

  const container = containerRef.value;
  const containerRect = container.getBoundingClientRect();
  const mouseX = e.clientX - containerRect.left;
  const newWidth = (mouseX / containerRect.width) * 100;

  // 限制寬度範圍 20% ~ 80%
  if (newWidth >= 20 && newWidth <= 80) {
    leftPanelWidth.value = newWidth;
  }
};

// 停止拖動
const handleMouseUp = () => {
  isDragging.value = false;
};

// 自動載入影片資料
const loadVideoFromApi = async (videoIdParam) => {
  if (!videoIdParam) return;

  lyricsLoading.value = true;
  try {
    const response = await MYAPI.get(`/get_video/${videoIdParam}`);

    if (response.status === "success" && response.data) {
      const data = response.data;

      // 映射 API 回應到元件變數
      videoId.value = data.source_id || "";
      videoTitle.value = data.name || "";
      videoChannel.value = data.artist || "";
      tag.value = data.tags || "";
      originalLyrics.value = data.original || "";

      // 解析轉換後的歌詞
      if (data.converted && data.converted.trim() !== "") {
        try {
          allLyrics.value = JSON.parse(data.converted);
        } catch (parseError) {
          console.error("解析歌詞資料時發生錯誤：", parseError);
          ElMessage.warning("歌詞資料格式錯誤，無法載入歌詞");
        }
      }

      ElMessage.success("影片資料載入成功");
    } else {
      ElMessage.warning("找不到指定的影片資料");
    }
  } catch (error) {
    console.error("載入影片資料時發生錯誤：", error);
    ElMessage.error("載入影片資料時發生錯誤");
  } finally {
    lyricsLoading.value = false;
  }
};

// 發布歌曲
const handlePublishSong = async () => {
  if (!videoId.value) {
    ElMessage.error("請先載入影片");
    return;
  }

  if (allLyrics.value.length === 0) {
    ElMessage.error("請先添加歌詞");
    return;
  }

  // 確認發布
  try {
    await ElMessageBox.confirm("確定要發布這首歌曲嗎?", "提示", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning",
    });

    // 準備表單數據
    formData.value.source_id = videoId.value;
    formData.value.name = videoTitle.value;
    formData.value.artist = videoChannel.value;
    formData.value.tags = tag.value;
    formData.value.original = originalLyrics.value;

    // 將歌詞轉換為JSON格式
    let result = [];
    for (const line of allLyrics.value) {
      if (line.lyrics.length === 0) continue;
      result.push({
        timestamp: line.timestamp,
        lyrics: line.lyrics,
      });
    }
    formData.value.converted = customStringify(result);

    // 發送請求
    saveVideo();
  } catch (error) {
    // 用戶取消操作
    if (error !== "cancel") {
      console.error("發布歌曲時發生錯誤：", error);
    }
  }
};

// 保存歌曲
const saveVideo = async () => {
  try {
    // 複製一份 formData 以避免直接修改響應式對象
    const formDataCopy = JSON.parse(JSON.stringify(formData.value));

    // 將id轉為int
    formDataCopy.id = parseInt(formDataCopy.id) || 0;

    const res = await MYAPI.post("/upsert_song", formDataCopy);

    if (res["status"] === "success") {
      ElMessage({
        type: "success",
        message: "歌曲發布成功",
      });
      isDirty.value = false;
    } else {
      console.error(res);
      ElMessage({
        type: res["status"] || "error",
        message: res["message"] || "發布失敗",
      });
    }
  } catch (error) {
    console.error("保存歌曲時發生錯誤：", error);
    ElMessage.error("保存歌曲時發生錯誤");
  }
};

const beforeUnloadHandler = (event) => {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
};

watch(
  [videoId, videoTitle, videoChannel, tag],
  () => {
    isDirty.value = true;
  },
  { deep: true },
);

watch(
  allLyrics,
  () => {
    isDirty.value = true;
  },
  { deep: true },
);

onMounted(async () => {
  await initializePlayer();
  await getApiKey();
  window.addEventListener("keypress", handleKeyPress, true);
  window.addEventListener("beforeunload", beforeUnloadHandler);

  // Resizer 事件監聽
  checkIfMobile();
  window.addEventListener("resize", checkIfMobile);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  // 檢查 URL 參數中是否有 video_id
  const urlVideoId = route.params.video_id;
  if (urlVideoId) {
    console.log(urlVideoId);
    if (urlVideoId != "empty") await loadVideoFromApi(urlVideoId);
  }
});

onUnmounted(() => {
  if (player) {
    player.destroy();
  }
  window.removeEventListener("keypress", handleKeyPress, true);
  window.removeEventListener("beforeunload", beforeUnloadHandler);

  // 清理 Resizer 事件監聽
  window.removeEventListener("resize", checkIfMobile);
  window.removeEventListener("mousemove", handleMouseMove);
  window.removeEventListener("mouseup", handleMouseUp);
});
</script>

<style scoped>
.lyrics-container {
  max-width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .lyrics-container > div {
    min-width: 100%;
  }
}

.lyric-cvt {
  background-color: darkgray;
}

.lyric-ori {
  background-color: cadetblue;
}

input {
  cursor: pointer;
  color: black;
}

input {
  color: black;
}

/* Resizer 樣式 */
.resizer {
  width: 6px;
  background-color: #e5e7eb;
  cursor: col-resize;
  flex-shrink: 0;
  transition: background-color 0.2s;
  position: relative;
}

.resizer:hover {
  background-color: #9ca3af;
}

.resizer:active,
.resizer-dragging {
  background-color: #6b7280;
}

/* 防止拖動時選中文字 */
.resizer-dragging * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>

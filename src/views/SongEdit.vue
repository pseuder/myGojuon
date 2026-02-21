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
        <!-- 影片資訊區 -->
        <div class="flex">
          <el-input v-model="videoId" class="w-full" placeholder="輸入YT ID" />
          <el-button type="primary" plain @click="handleReloadYT"
            >載入影片</el-button
          >
          <el-button type="primary" @click="openSearchDialog"
            >搜尋影片</el-button
          >
          <el-button class="grow" type="success" @click="handlePublishSong"
            >發布歌曲</el-button
          >
        </div>
        <div class="flex gap-2">
          <el-input
            v-model="videoTitle"
            class="w-full"
            placeholder="輸入歌名"
          />
        </div>
        <div class="flex gap-2">
          <el-input
            v-model="videoChannel"
            class="w-full"
            placeholder="輸入歌手名稱"
          />
        </div>
        <div class="flex gap-2">
          <el-input v-model="tag" class="w-full" placeholder="輸入標籤" />
        </div>

        <!-- 歌詞操作區 -->
        <div class="flex gap-2">
          <el-button type="info" plain @click="handleClearLyrics" class="flex-1"
            >清空</el-button
          >
          <el-button
            class="flex-1"
            type="primary"
            plain
            @click="handleLyricsDialogOpen"
            >貼上歌詞</el-button
          >
          <el-button
            class="flex-1"
            type="primary"
            plain
            @click="convertedLyricsDialogVisible = true"
            >貼上轉換歌詞</el-button
          >
        </div>
        <div class="flex gap-2">
          <el-button
            class="flex-1"
            type="warning"
            plain
            @click="handleClearTime"
            >清空時間部分</el-button
          >
          <el-button class="flex-1" type="warning" plain @click="handleCopy"
            >複製歌詞</el-button
          >
          <el-button
            class="flex-1"
            type="warning"
            plain
            @click="handleCopyHiragana"
            >複製轉換歌詞</el-button
          >
        </div>

        <!-- 時間控制區 -->
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

        <!-- 播放控制區 -->
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

        <!-- 影片播放器 -->
        <div class="flex h-[10%] flex-col gap-2">
          <div id="player-container" ref="playerContainerRef" class="h-fit">
            <div
              id="player"
              ref="playerRef"
              style="max-height: 430px; aspect-ratio: 4/3"
            ></div>
          </div>
          <div class="w-full">
            <el-space wrap>
              <el-tag type="info">a - 往前3秒</el-tag>
              <el-tag type="info">s - 暫停/開始</el-tag>
              <el-tag type="info">d - 往後3秒</el-tag>
              <el-tag type="info">enter - 紀錄時間</el-tag>
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

      <!-- 右側面板: 歌詞列表 -->
      <el-scrollbar
        class="lyrics-container h-full overflow-x-auto"
        :style="{ width: isMobile ? '100%' : `${100 - leftPanelWidth}%` }"
        v-loading="lyricsLoading"
      >
        <div>
          <div
            v-for="(line, index) in allLyrics"
            :key="index"
            :id="`lyric-${index}`"
            :class="{ 'bg-yellow-100': currentLyricIndex === index }"
            class="flex items-center gap-4 py-4"
            style="border-block-width: 6px; border-block-color: #e5e7eb"
          >
            <!-- 行控制區 -->
            <div class="flex flex-shrink-0 flex-col items-center">
              <div class="flex">
                <el-button link plain @click="startVideoOn(line.timestamp)">
                  <el-icon :size="25"><Switch /></el-icon>
                </el-button>
                <el-button link plain @click="handleDelete(index)">
                  <el-icon :size="25" color="red"><Delete /></el-icon>
                </el-button>
                <el-button
                  link
                  class="text-sm text-blue-500"
                  @click="handleAddNewLyricLine(index)"
                >
                  <el-icon :size="25" color="blue"><Plus /></el-icon>
                </el-button>
                <el-button
                  link
                  class="text-sm text-blue-500"
                  @click="handleDuplicateLyricLine(index)"
                >
                  <el-icon :size="25" color="blue"><CopyDocument /></el-icon>
                </el-button>
              </div>

              <input
                v-model="line.timestamp"
                class="h-6 w-28 cursor-auto rounded border border-gray-300 px-1"
                placeholder="輸入時間"
              />

              <div class="flex">
                <el-button link @click="handleDecreaseTime(index, 5)"
                  >-5</el-button
                >
                <el-button link @click="handleDecreaseTime(index, 10)"
                  >-10</el-button
                >
                <el-button link @click="handleIncreaseTime(index, 5)"
                  >+5</el-button
                >
                <el-button link @click="handleIncreaseTime(index, 10)"
                  >+10</el-button
                >
              </div>
            </div>

            <!-- 歌詞字元區 -->
            <div class="flex w-full flex-wrap items-center gap-2">
              <template v-for="(ly, lyIndex) in line.lyrics" :key="lyIndex">
                <div
                  class="flex w-28 flex-col"
                  :id="`lyric-cvt-${index}-${lyIndex}`"
                >
                  <!-- 字元操作按鈕 -->
                  <span class="flex">
                    <el-button
                      class="text-sm text-yellow-500"
                      @click="handleDoubleClick(index, lyIndex, ly.ori)"
                      type="text"
                      >推</el-button
                    >
                    <el-button
                      class="text-sm text-blue-500"
                      @click="handleWidthenLyric(index, lyIndex)"
                      type="text"
                      >寬</el-button
                    >
                    <el-button
                      class="text-sm text-red-500"
                      @click="handleDeleteLyric(index, lyIndex)"
                      type="text"
                      >刪</el-button
                    >
                    <el-button
                      class="text-sm text-yellow-800"
                      @click="handleAddLyric(index, lyIndex)"
                      type="text"
                      >增</el-button
                    >
                  </span>

                  <!-- 轉換/原文/顏色輸入 -->
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

                  <!-- 顏色控制 -->
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
                      >X</el-button
                    >
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- Dialog: 貼上原始歌詞 -->
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

    <!-- Dialog: 貼上轉換歌詞 -->
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

    <!-- Dialog: YouTube 搜尋 -->
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
                      >選擇</el-button
                    >
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

    <!-- Dialog: 顏色選擇 -->
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

// ============================================================
// 基礎設定
// ============================================================
const route = useRoute();
const MYAPI = useApi();
const isDirty = ref(false);

// ============================================================
// 影片資訊
// ============================================================
const videoId = ref("");
const videoTitle = ref("");
const videoChannel = ref("");
const tag = ref("");

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

// ============================================================
// YouTube Player
// ============================================================
const playerRef = ref(null);
const playerContainerRef = ref(null);
let player = null;
const isPlaying = ref(false);
const playbackRate = ref(1);
const autoScroll = ref(false);
const apiKey = ref("");

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

const initializePlayer = async () => {
  await loadYouTubeAPI();
  player = new YT.Player(playerRef.value, {
    videoId: videoId.value,
    height: "100%",
    width: "100%",
    playerVars: { autoplay: 0, playsinline: 1 },
    events: {
      onReady: (event) => {
        setInterval(updateCurrentLyric, 100);
        event.target.setPlaybackRate(playbackRate.value);
        window.player = event.target;
        if (videoId.value) handleReloadYT();
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

const handleReloadYT = () => {
  if (!videoId.value) return;
  if (player) {
    player.loadVideoById(videoId.value);
    player.playVideo();
  }
};

const handleYTBack = (seconds) => {
  if (player) player.seekTo(player.getCurrentTime() - seconds, true);
};

const handleYTForward = (seconds) => {
  if (player) player.seekTo(player.getCurrentTime() + seconds, true);
};

const handleYTStopStart = () => {
  if (!player) return;
  if (isPlaying.value) {
    player.pauseVideo();
    isPlaying.value = false;
  } else {
    player.playVideo();
    isPlaying.value = true;
  }
};

const changePlaybackRate = (value) => {
  if (player && player.setPlaybackRate) player.setPlaybackRate(value);
};

const startVideoOn = (time) => {
  if (player) {
    player.seekTo(parseTimeToSeconds(time));
    player.playVideo();
  }
};

const getApiKey = async () => {
  try {
    const response = await MYAPI.get("/get_yt_api_key");
    apiKey.value = response.data;
  } catch (error) {
    ElMessage.error("取得 API Key 時發生錯誤");
  }
};

// ============================================================
// YouTube 搜尋 Dialog
// ============================================================
const searchDialogVisible = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const loading = ref(false);
const nextPageToken = ref(false);

const openSearchDialog = () => {
  searchDialogVisible.value = true;
};
const closeSearchDialog = () => {
  searchDialogVisible.value = false;
};

const searchYouTube = async () => {
  loading.value = true;
  searchResults.value = [];
  nextPageToken.value = "";
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
    ElMessage.error("搜尋 YouTube 影片時發生錯誤");
  } finally {
    loading.value = false;
  }
};

const selectVideo = (videoItemFromSearch) => {
  videoId.value = videoItemFromSearch.id.videoId;
  videoTitle.value = videoItemFromSearch.snippet.title;
  videoChannel.value = videoItemFromSearch.snippet.channelTitle;
  closeSearchDialog();
  handleReloadYT();
};

// ============================================================
// 歌詞資料
// ============================================================
const lyricsLoading = ref(false);
const allLyrics = ref([]);
const currentLyricIndex = ref(-1);
const originalLyrics = ref("");

const parseTimeToSeconds = (timeString) => {
  if (!timeString) return 0;
  const match = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (match) return parseInt(match[1]) * 60 + parseFloat(match[2]);
  return 0;
};

const updateCurrentLyric = () => {
  if (!player || !player.getCurrentTime) return;
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
};

const scrollToCurrentLyric = (index) => {
  document
    .getElementById(`lyric-${index}`)
    ?.scrollIntoView({ behavior: "smooth", block: "center" });
};

// ============================================================
// 歌詞貼上 Dialog
// ============================================================
const lyricsDialogVisible = ref(false);

const handleLyricsDialogOpen = () => {
  lyricsDialogVisible.value = true;
};
const handleLyricsDialogClose = () => {
  lyricsDialogVisible.value = false;
};

const handleLyricsDialogSubmit = async () => {
  lyricsLoading.value = true;
  try {
    const response = await MYAPI.post("/convert_lyrics", {
      lyrics: originalLyrics.value,
    });
    if (response.status === "success") {
      ElMessage.success("歌詞轉換成功");
      allLyrics.value = response.data;
    } else {
      ElMessage.error(response.message);
    }
  } catch (error) {
    ElMessage.error("轉換歌詞時發生錯誤");
  } finally {
    lyricsLoading.value = false;
  }
  lyricsDialogVisible.value = false;
};

// ============================================================
// 轉換歌詞 Dialog
// ============================================================
const convertedLyricsDialogVisible = ref(false);
const convertedLyrics = ref("");

const convertedLyricsDialogSubmit = () => {
  allLyrics.value = JSON.parse(convertedLyrics.value);
  convertedLyricsDialogVisible.value = false;
};

// ============================================================
// 歌詞行操作（清空、插入、刪除、新增、複製）
// ============================================================
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
  if (!window.player) return;
  const currentTime = window.player.getCurrentTime();
  const minutes = Math.floor(currentTime / 60);
  const seconds = Math.floor(currentTime % 60);
  const milliseconds = Math.floor((currentTime % 1) * 100);
  const formattedTime = `[${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}]`;

  const emptyIndex = allLyrics.value.findIndex((line) => !line.timestamp);
  if (emptyIndex !== -1) {
    allLyrics.value[emptyIndex].timestamp = formattedTime;
  } else {
    allLyrics.value.push({ timestamp: formattedTime, lyrics: "" });
  }
  nextTick(() =>
    scrollToCurrentLyric(
      emptyIndex !== -1 ? emptyIndex : allLyrics.value.length - 1,
    ),
  );
};

const handleDelete = (index) => {
  allLyrics.value.splice(index, 1);
};

const handleAddNewLyricLine = (index) => {
  allLyrics.value.splice(index + 1, 0, {
    timestamp: "",
    lyrics: [{ cvt: "", ori: "", color: "" }],
  });
};

const handleDuplicateLyricLine = (index) => {
  allLyrics.value.splice(
    index + 1,
    0,
    JSON.parse(JSON.stringify(allLyrics.value[index])),
  );
};

// ============================================================
// 歌詞字元操作（刪除、新增、加寬）
// ============================================================
const handleDeleteLyric = (lyricIndex, lyricLineIndex) => {
  allLyrics.value[lyricIndex].lyrics.splice(lyricLineIndex, 1);
};

const handleAddLyric = (lyricIndex, lyricLineIndex) => {
  allLyrics.value[lyricIndex].lyrics.splice(lyricLineIndex + 1, 0, {
    cvt: "",
    ori: "",
    color: "",
  });
};

const handleWidthenLyric = (lyricIndex, lyricLineIndex) => {
  const el = document.querySelector(
    `#lyric-cvt-${lyricIndex}-${lyricLineIndex}`,
  );
  if (!el) return;
  const originWidth = el.style.width;
  el.style.width =
    originWidth === "" ? "162px" : `${parseInt(originWidth) + 50}px`;
};

// ============================================================
// 時間戳操作
// ============================================================
const timeDiff = ref("00:00.10");

const msToTimestamp = (totalMs) => {
  const newMinutes = Math.floor(totalMs / (60 * 100));
  const newSeconds = Math.floor((totalMs % (60 * 100)) / 100);
  const newMs = totalMs % 100;
  return `[${String(newMinutes).padStart(2, "0")}:${String(newSeconds).padStart(2, "0")}.${String(newMs).padStart(2, "0")}]`;
};

const parseTimestamp = (timestamp) => {
  const match = timestamp?.match(/\[(\d{2}):(\d{2})\.(\d{2})\]/);
  if (!match) return null;
  return (
    parseInt(match[1]) * 60 * 100 +
    parseInt(match[2]) * 100 +
    parseInt(match[3])
  );
};

const handleIncreaseTime = (index, milliseconds) => {
  if (index < 0 || index >= allLyrics.value.length) return;
  const totalMs = parseTimestamp(allLyrics.value[index].timestamp);
  if (totalMs === null) return;
  allLyrics.value[index].timestamp = msToTimestamp(totalMs + milliseconds);
  ElMessage.success(`時間戳增加 ${milliseconds} 毫秒`);
};

const handleDecreaseTime = (index, milliseconds) => {
  if (index < 0 || index >= allLyrics.value.length) return;
  const totalMs = parseTimestamp(allLyrics.value[index].timestamp);
  if (totalMs === null) return;
  allLyrics.value[index].timestamp = msToTimestamp(
    Math.max(0, totalMs - milliseconds),
  );
  ElMessage.success(`時間戳減少 ${milliseconds} 毫秒`);
};

const handleBulkTimeDiff = (operator) => {
  const deltaMatch = timeDiff.value.match(/(\d{2}):(\d{2})\.(\d{2})/);
  if (!deltaMatch) {
    ElMessage.error("時間差格式錯誤，請輸入 mm:ss.ms");
    return;
  }
  const deltaTotalMs =
    parseInt(deltaMatch[1]) * 60 * 100 +
    parseInt(deltaMatch[2]) * 100 +
    parseInt(deltaMatch[3]);

  allLyrics.value = allLyrics.value.map((line) => {
    const totalMs = parseTimestamp(line.timestamp);
    if (totalMs === null) return line;
    const newTotalMs = Math.max(
      0,
      totalMs + (operator === "add" ? deltaTotalMs : -deltaTotalMs),
    );
    line.timestamp = msToTimestamp(newTotalMs);
    return line;
  });
  ElMessage.success("時間調整完成");
};

// ============================================================
// 推薦假名 Popover
// ============================================================
const recommendQuery = ref("");
const recommendLoading = ref(false);
const recommendHiraganas = ref([]);
const currentOpenPopover = ref({ lineIndex: -1, lyricIndex: -1 });
const hiraganaCache = ref(new Map());
const CACHE_MAX_SIZE = 10;

const isPopoverVisible = (lineIndex, lyricIndex) =>
  currentOpenPopover.value.lineIndex === lineIndex &&
  currentOpenPopover.value.lyricIndex === lyricIndex;

const closePopover = () => {
  currentOpenPopover.value = { lineIndex: -1, lyricIndex: -1 };
};

const handleRecommendHiragana = async (text) => {
  if (!text) return;
  if (hiraganaCache.value.has(text)) {
    const cached = hiraganaCache.value.get(text);
    recommendHiraganas.value = cached;
    hiraganaCache.value.delete(text);
    hiraganaCache.value.set(text, cached);
    return;
  }
  if (text === recommendQuery.value) return;
  recommendHiraganas.value = [];
  recommendLoading.value = true;
  recommendQuery.value = text;
  try {
    const response = await MYAPI.get("gemini_recommend_hiragana", { text });
    recommendHiraganas.value = response.data;
    hiraganaCache.value.set(text, response.data);
    if (hiraganaCache.value.size > CACHE_MAX_SIZE) {
      hiraganaCache.value.delete(hiraganaCache.value.keys().next().value);
    }
  } catch {
    ElMessage.error("獲取推薦假名失敗");
  } finally {
    recommendLoading.value = false;
  }
};

const handleDoubleClick = (lineIndex, lyricIndex, text) => {
  currentOpenPopover.value = { lineIndex, lyricIndex };
  handleRecommendHiragana(text);
};

// ============================================================
// 顏色選擇 Dialog
// ============================================================
const colorPickerVisible = ref(false);
const selectedColor = ref("");
const currentColorLyricIndex = ref(-1);
const currentColorLyricLineIndex = ref(-1);

const openColorPicker = (lyricIndex, lyricLineIndex) => {
  currentColorLyricIndex.value = lyricIndex;
  currentColorLyricLineIndex.value = lyricLineIndex;
  selectedColor.value =
    allLyrics.value[lyricIndex]?.lyrics[lyricLineIndex]?.color || "#000000";
  colorPickerVisible.value = true;
};

const applyColor = () => {
  const target =
    allLyrics.value[currentColorLyricIndex.value]?.lyrics[
      currentColorLyricLineIndex.value
    ];
  if (target) {
    target.color = selectedColor.value;
    ElMessage.success("顏色設定成功");
  }
  colorPickerVisible.value = false;
};

// ============================================================
// 複製歌詞
// ============================================================
const customStringify = (obj) =>
  JSON.stringify(obj, null, 2)
    .replace(
      /{\s*"cvt":\s*"([^"]*)",\s*"ori":\s*"([^"]*)",\s*"color":\s*"([^"]*)"\s*}/g,
      '{"cvt": "$1","ori": "$2","color": "$3"}',
    )
    .replace(
      /{\s*"cvt":\s*"([^"]*)",\s*"ori":\s*"([^"]*)"\s*}/g,
      '{"cvt": "$1","ori": "$2"}',
    )
    .replace(/},\s+]/g, "},\n  ]");

const combinedLyric = () =>
  allLyrics.value
    .filter((line) => line.lyrics.length > 0)
    .map(
      (line) => `${line.timestamp}${line.lyrics.map((ly) => ly.ori).join("")}`,
    )
    .join("\n");

const handleCopy = () => {
  navigator.clipboard.writeText(combinedLyric());
  ElMessage.success("複製成功");
};

const handleCopyHiragana = () => {
  const result = allLyrics.value
    .filter((line) => line.lyrics.length > 0)
    .map((line) => ({
      timestamp: line.timestamp,
      lyrics: line.lyrics.map((ly) =>
        ly.color
          ? { cvt: ly.cvt, ori: ly.ori, color: ly.color }
          : { cvt: ly.cvt, ori: ly.ori },
      ),
    }));
  navigator.clipboard.writeText(customStringify(result));
  ElMessage.success("複製成功");
};

// ============================================================
// 發布 / 儲存歌曲
// ============================================================
const handlePublishSong = async () => {
  if (!videoId.value) return ElMessage.error("請先載入影片");
  if (allLyrics.value.length === 0) return ElMessage.error("請先添加歌詞");

  try {
    await ElMessageBox.confirm("確定要發布這首歌曲嗎?", "提示", {
      confirmButtonText: "確定",
      cancelButtonText: "取消",
      type: "warning",
    });

    formData.value.source_id = videoId.value;
    formData.value.name = videoTitle.value;
    formData.value.artist = videoChannel.value;
    formData.value.tags = tag.value;
    formData.value.original = originalLyrics.value;
    formData.value.converted = customStringify(
      allLyrics.value
        .filter((line) => line.lyrics.length > 0)
        .map((line) => ({ timestamp: line.timestamp, lyrics: line.lyrics })),
    );

    await saveVideo();
  } catch (error) {
    if (error !== "cancel") ElMessage.error("發布歌曲時發生錯誤");
  }
};

const saveVideo = async () => {
  try {
    const payload = {
      ...JSON.parse(JSON.stringify(formData.value)),
      id: parseInt(formData.value.id) || 0,
    };
    const res = await MYAPI.post("/upsert_song", payload);
    if (res["status"] === "success") {
      ElMessage.success("歌曲發布成功");
      isDirty.value = false;
    } else {
      ElMessage({
        type: res["status"] || "error",
        message: res["message"] || "發布失敗",
      });
    }
  } catch {
    ElMessage.error("保存歌曲時發生錯誤");
  }
};

// ============================================================
// 從 API 載入影片資料
// ============================================================
const loadVideoFromApi = async (videoIdParam) => {
  if (!videoIdParam) return;
  lyricsLoading.value = true;
  try {
    const response = await MYAPI.get(`/get_song/${videoIdParam}`);
    if (response.status === "success" && response.data) {
      const data = response.data;
      videoId.value = data.source_id || "";
      videoTitle.value = data.name || "";
      videoChannel.value = data.artist || "";
      tag.value = data.tags || "";
      originalLyrics.value = data.original || "";
      if (data.converted?.trim()) {
        try {
          allLyrics.value = JSON.parse(data.converted);
        } catch {
          ElMessage.warning("歌詞資料格式錯誤，無法載入歌詞");
        }
      }
      ElMessage.success("影片資料載入成功");
    } else {
      ElMessage.warning("找不到指定的影片資料");
    }
  } catch {
    ElMessage.error("載入影片資料時發生錯誤");
  } finally {
    lyricsLoading.value = false;
  }
};

// ============================================================
// 鍵盤事件
// ============================================================
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

// ============================================================
// 可拖動分隔線 (Resizer)
// ============================================================
const containerRef = ref(null);
const leftPanelWidth = ref(33);
const isDragging = ref(false);
const isMobile = ref(false);

const checkIfMobile = () => {
  isMobile.value = window.innerWidth < 640;
};

const handleMouseDown = (e) => {
  isDragging.value = true;
  e.preventDefault();
};

const handleMouseMove = (e) => {
  if (!isDragging.value || !containerRef.value) return;
  const rect = containerRef.value.getBoundingClientRect();
  const newWidth = ((e.clientX - rect.left) / rect.width) * 100;
  if (newWidth >= 20 && newWidth <= 80) leftPanelWidth.value = newWidth;
};

const handleMouseUp = () => {
  isDragging.value = false;
};

// ============================================================
// 離開頁面警示
// ============================================================
const beforeUnloadHandler = (event) => {
  if (isDirty.value) {
    event.preventDefault();
    event.returnValue = "";
  }
};

// ============================================================
// Watch
// ============================================================
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

// ============================================================
// 生命週期
// ============================================================
onMounted(async () => {
  await initializePlayer();
  await getApiKey();

  window.addEventListener("keypress", handleKeyPress, true);
  window.addEventListener("beforeunload", beforeUnloadHandler);
  window.addEventListener("resize", checkIfMobile);
  window.addEventListener("mousemove", handleMouseMove);
  window.addEventListener("mouseup", handleMouseUp);

  checkIfMobile();

  const urlVideoId = route.params.video_id;
  if (urlVideoId && urlVideoId !== "empty") await loadVideoFromApi(urlVideoId);
});

onUnmounted(() => {
  if (player) player.destroy();
  window.removeEventListener("keypress", handleKeyPress, true);
  window.removeEventListener("beforeunload", beforeUnloadHandler);
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

.resizer-dragging * {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>

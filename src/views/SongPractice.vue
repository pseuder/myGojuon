<template>
  <!-- 頁面結構基本不變 -->
  <div class="flex h-full flex-col lg:overflow-hidden">
    <div
      v-if="currentVideo"
      class="flex h-full flex-col gap-4 px-4 py-4 md:px-10 lg:flex-row lg:gap-0"
    >
      <!-- 影片播放器+功能列 -->
      <div
        class="flex h-full flex-col"
        :style="{ width: isMobile ? '100%' : `${leftWidth}%` }"
      >
        <div class="shrink-0">
          <!-- 影片標題＋作者 -->
          <div class="gradient-text-tech-animated">
            {{ currentVideo.name }} - {{ currentVideo.author }}
          </div>
          <!-- 標籤 -->
          <div
            v-if="currentVideo.tags"
            class="mb-4 flex flex-wrap items-center gap-2"
          >
            <template v-for="tag in currentVideo.tags?.split(',')" :key="tag">
              <el-tag type="info">{{ tag }}</el-tag>
            </template>
          </div>
        </div>

        <!-- 影片播放器 -->
        <div
          id="player-container"
          ref="playerContainerRef"
          class="flex-1 overflow-auto"
        >
          <div
            id="player"
            ref="playerRef"
            class="aspect-video w-full lg:h-full"
          ></div>
        </div>

        <!-- 功能列 -->
        <div class="flex shrink-0 flex-col gap-2">
          <div class="my-4 flex h-full w-full flex-col items-center gap-2">
            <div class="flex w-full flex-row">
              <div class="flex w-full flex-1 flex-col justify-between gap-4">
                <div
                  class="cursor-pointer hover:text-blue-500"
                  @click="goToPreviousLyric()"
                >
                  <el-tag type="warning">A</el-tag>{{ t("jump_previous_line") }}
                </div>
                <div
                  class="cursor-pointer hover:text-blue-500"
                  @click="goToNextLyric()"
                >
                  <el-tag type="warning">D</el-tag>{{ t("jump_next_line") }}
                </div>
                <div
                  class="cursor-pointer hover:text-blue-500"
                  @click="toggleLoopCurrentLyric()"
                >
                  <el-tag type="warning">S</el-tag>
                  <span v-if="isLooping" class="text-red-600">
                    {{ t("stop_looping") }}</span
                  >
                  <span v-else> {{ t("loop_playback") }}</span>
                </div>
              </div>

              <div class="flex flex-1 flex-col gap-1">
                <el-checkbox v-model="autoScroll">{{
                  t("scrolling")
                }}</el-checkbox>
                <el-checkbox v-model="autoPlayNext">{{
                  t("auto_play_next_song")
                }}</el-checkbox>
                <el-input-number
                  v-model="playbackRate"
                  :precision="1"
                  :step="0.1"
                  :max="2"
                  :min="0.3"
                  @change="changePlaybackRate(playbackRate)"
                />
              </div>
            </div>
          </div>

          <el-alert v-if="currentVideo.remark" type="success">
            <p class="w-[88%] wrap-break-word">
              {{ currentVideo.remark }}
            </p>
          </el-alert>
          <!-- <el-tag v-if="currentVideo.remark" type="success"></el-tag> -->
        </div>
      </div>

      <!-- 可拖動分隔線 (只在寬螢幕顯示) -->
      <div
        v-if="!isMobile"
        class="mr-1 ml-1 hidden w-1 flex-shrink-0 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500 lg:flex"
        @mousedown="startResize"
      ></div>

      <!-- 歌詞  -->
      <el-scrollbar
        class="h-full overflow-x-auto"
        :style="{
          width: isMobile ? '100%' : `calc(${100 - leftWidth}% - 4px)`,
        }"
      >
        <!-- <el-button type="warning" size="small" @click="handleCopyLyrics" plain>
          複製歌詞
        </el-button> -->
        <div class="">
          <div
            v-for="(line, index) in lyrics"
            :key="index"
            :id="`lyric-${index}`"
            :class="{ 'bg-yellow-200': currentLyricIndex === index }"
            class="flex items-center gap-4 py-2"
          >
            <div class="flex flex-shrink-0 items-center">
              <el-button
                type="primary"
                link
                plain
                @click="handleStartVideoClick(line.timestamp)"
              >
                <el-icon :size="25" title="跳轉到此">
                  <Right />
                </el-icon>
              </el-button>
            </div>
            <div class="flex flex-wrap gap-2">
              <template v-for="(ly, lyIndex) in line.lyrics" :key="lyIndex">
                <div class="flex flex-col items-center justify-center">
                  <div
                    class="h-3 text-sm"
                    :style="ly.color ? { color: ly.color } : {}"
                  >
                    {{ display_mode === "both" ? ly.cvt : "" }}
                  </div>
                  <div
                    class="text-xl"
                    :style="ly.color ? { color: ly.color } : {}"
                  >
                    {{ ly.ori }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
    <!-- 增加載入中狀態顯示 -->
    <div v-else class="flex h-full items-center justify-center">
      <p>Loading song...</p>
    </div>

    <!-- 浮動播放/暫停按鈕 (只在小於lg螢幕時顯示) -->
    <div v-if="currentVideo" class="fixed right-8 bottom-22 z-50 lg:hidden">
      <el-button type="primary" size="large" circle @click="togglePlayPause">
        <el-icon :size="28">
          <VideoPause v-if="isPlaying" />
          <VideoPlay v-else />
        </el-icon>
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { VideoPause, VideoPlay, Right } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
const { t } = useI18n();

import { useApi } from "@/composables/useApi.js";
const MYAPI = useApi();
import { useRouter, useRoute } from "vue-router";
const router = useRouter();

const localePath = (p) => p;

// --- 數據獲取 ---

const route = useRoute();
const videoId = computed(() => route.params.uid);
const uid = route.params.uid;

const videoData = ref(null);
const currentVideo = computed(() => videoData.value);
const lyrics = computed(() => {
  if (videoData.value?.converted) {
    try {
      return JSON.parse(videoData.value.converted);
    } catch (e) {
      return [];
    }
  }
  return [];
});

const siteUrl = import.meta.env.VITE_SITE_BASE || "https://mygojuon.vercel.app";

const fetchVideoData = async (id) => {
  if (!id) return;
  try {
    const response = await MYAPI.get(`/get_video/${id}`);
    if (response.data) {
      videoData.value = response.data;
    }
  } catch (err) {
    console.error("Error fetching video data:", err);
  }
};

// --- 播放器與互動邏輯  ---

const playerRef = ref(null);
let player = null;
const currentLyricIndex = ref(-1);

const display_mode = ref("both");
const playbackRate = ref(1);
const autoScroll = ref(true);
const autoPlayNext = ref(false);
const isPlaying = ref(false);
const isLooping = ref(false);
const loopStart = ref(0);
const loopEnd = ref(0);

// 可調整寬度相關
const leftWidth = ref(50); // 左側寬度百分比
const isResizing = ref(false);
const windowWidth = ref(0);
const isMobile = computed(() => windowWidth.value < 1024);

const allVideos = ref([]);
const fetchAllVideos = async () => {
  try {
    // 使用 $fetch
    const params = {
      author_id: currentVideo.value?.author_id || "",
    };
    const res = await MYAPI.get("/get_all_videos", params);
    allVideos.value = res.data.data;
  } catch (error) {
    console.error("Error fetching all videos:", error);
    ElMessage.error("無法獲取所有歌曲列表");
    allVideos.value = [];
  }
};

const authorFilteredVideos = computed(() => {
  if (
    !currentVideo.value ||
    !currentVideo.value.author ||
    !allVideos.value.length
  ) {
    return [];
  }
  return allVideos.value
    .filter((video) => video.author === currentVideo.value.author)
    .sort((a, b) => a.uid - b.uid);
});

const currentVideoIndexInAuthorList = computed(() => {
  if (!currentVideo.value || !authorFilteredVideos.value.length) {
    return -1;
  }
  // 注意：原來的 videoId 是 YouTube ID，這裡假設 uid 是影片的唯一標識符
  return authorFilteredVideos.value.findIndex(
    (v) => v.source_id === videoId.value,
  );
});

// 解析時間戳
const parseTimeToSeconds = (timeString) => {
  if (!timeString) return 0;
  const timeStringmatch = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (timeStringmatch) {
    return parseInt(timeStringmatch[1]) * 60 + parseFloat(timeStringmatch[2]);
  }
  return 0;
};

// YouTube Player 初始化
const initializePlayer = () => {
  // 確保 YT API 已載入且在客戶端環境
  if (
    typeof window.YT === "undefined" ||
    typeof window.YT.Player === "undefined"
  ) {
    // 如果 API 還沒好，稍後再試
    setTimeout(initializePlayer, 100);
    return;
  }

  if (!playerRef.value) return;

  // 如果已有播放器實例，先銷毀
  if (player) {
    player.destroy();
    player = null;
  }

  player = new window.YT.Player(playerRef.value, {
    videoId: videoId.value, // 直接使用 videoId
    height: "100%",
    width: "100%",
    playerVars: { autoplay: 1, playsinline: 1 },
    events: {
      onReady: (event) => {
        setInterval(updateCurrentLyric, 100);
        event.target.setPlaybackRate(playbackRate.value);
      },
      onStateChange: (event) => {
        isPlaying.value = event.data === window.YT.PlayerState.PLAYING;
        if (event.data === window.YT.PlayerState.ENDED) {
          playNextSong();
          player.seekTo(0);
        }
      },
      onError: (event) => {
        console.error("YouTube Player Error:", event.data);
        ElMessage.error(`播放器錯誤: ${event.data}`);
      },
    },
  });
};

const playNextSong = () => {
  // 如果未勾選自動播放，只重播當前歌曲
  if (!autoPlayNext.value) {
    if (player && player.seekTo) player.seekTo(0);
    return;
  }

  if (currentVideoIndexInAuthorList.value === -1) {
    if (player && player.seekTo) player.seekTo(0);
    return;
  }

  const nextIndex = currentVideoIndexInAuthorList.value + 1;
  if (nextIndex < authorFilteredVideos.value.length) {
    const nextSong = authorFilteredVideos.value[nextIndex];
    ElMessage.info(`${t("play_next_song")}: ${nextSong.name}`);
    // [變更] 使用 Nuxt router 導航
    router.push(localePath(`/SongPractice/${nextSong.source_id}`));
  } else {
    ElMessage.info(t("last_song_and_replay"));
    if (player && player.seekTo) player.seekTo(0);
  }
};

// 當 videoId 改變時，重新初始化播放器
watch(videoId, async (newId, oldId) => {
  if (newId && newId !== oldId && true) {
    // 重置狀態
    currentLyricIndex.value = -1;
    isLooping.value = false;

    // 手動刷新數據以確保獲取新歌曲的信息
    await fetchVideoData(newId);

    // 重新獲取所有影片列表（因為可能切換到不同歌手）
    await fetchAllVideos();

    // 重新初始化播放器
    initializePlayer();
  }
});

// 監聽自動播放, 播放速率和自動滾動的變化
watch(autoPlayNext, (newValue) => {
  if (true) {
    localStorage.setItem("myGojuon_autoPlayNext", JSON.stringify(newValue));
  }
});

watch(playbackRate, (newValue) => {
  if (true) {
    localStorage.setItem("myGojuon_playbackRate", JSON.stringify(newValue));
  }
});

watch(autoScroll, (newValue) => {
  if (true) {
    localStorage.setItem("myGojuon_autoScroll", JSON.stringify(newValue));
  }
});

// --- 以下是大部分可以保留的客戶端互動邏輯 ---

const updateCurrentLyric = () => {
  if (
    player &&
    typeof player.getCurrentTime === "function" &&
    lyrics.value.length > 0
  ) {
    const currentTime = player.getCurrentTime();
    if (isLooping.value && loopEnd.value > 0 && currentTime >= loopEnd.value) {
      player.seekTo(loopStart.value);
      return;
    }
    for (let i = 0; i < lyrics.value.length; i++) {
      const lineStartTime = parseTimeToSeconds(lyrics.value[i].timestamp);
      const nextLineStartTime =
        i < lyrics.value.length - 1
          ? parseTimeToSeconds(lyrics.value[i + 1].timestamp)
          : player.getDuration() || Infinity;
      if (currentTime >= lineStartTime && currentTime < nextLineStartTime) {
        if (currentLyricIndex.value !== i) {
          currentLyricIndex.value = i;
          if (autoScroll.value) scrollToCurrentLyric(i);
        }
        break;
      }
    }
  }
};

const scrollToCurrentLyric = (index) => {
  // `document` 只能在客戶端使用
  if (true) {
    const lyricElement = document.getElementById(`lyric-${index}`);
    if (lyricElement) {
      lyricElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }
};

const startVideo = (time) => {
  if (player && player.seekTo) {
    player.seekTo(parseTimeToSeconds(time));
    player.playVideo();
  }
};

const handleStartVideoClick = (time) => {
  if (isLooping.value) toggleLoopCurrentLyric();
  startVideo(time);
};

const togglePlayPause = () => {
  if (player) {
    isPlaying.value ? player.pauseVideo() : player.playVideo();
  }
};

const changePlaybackRate = (value) => {
  if (player && player.setPlaybackRate) {
    player.setPlaybackRate(value);
  }
};

const goToPreviousLyric = () => {
  if (currentLyricIndex.value > 0 && lyrics.value.length > 0) {
    startVideo(lyrics.value[currentLyricIndex.value - 1].timestamp);
  }
};

const goToNextLyric = () => {
  if (currentLyricIndex.value < lyrics.value.length - 1) {
    startVideo(lyrics.value[currentLyricIndex.value + 1].timestamp);
  }
};

const skipBackward = () => {
  if (player && player.getCurrentTime && player.seekTo) {
    const currentTime = player.getCurrentTime();
    player.seekTo(Math.max(0, currentTime - 3));
  }
};

const skipForward = () => {
  if (player && player.getCurrentTime && player.seekTo) {
    const currentTime = player.getCurrentTime();
    const duration = player.getDuration ? player.getDuration() : Infinity;
    player.seekTo(Math.min(duration, currentTime + 3));
  }
};

const toggleLoopCurrentLyric = () => {
  if (lyrics.value.length === 0 || currentLyricIndex.value < 0) {
    ElMessage.warning("沒有可循環的歌詞行");
    return;
  }
  isLooping.value = !isLooping.value;
  if (isLooping.value) {
    loopStart.value = parseTimeToSeconds(
      lyrics.value[currentLyricIndex.value].timestamp,
    );
    loopEnd.value =
      currentLyricIndex.value < lyrics.value.length - 1
        ? parseTimeToSeconds(
            lyrics.value[currentLyricIndex.value + 1].timestamp,
          )
        : player && player.getDuration
          ? player.getDuration()
          : Infinity;
    ElMessage.success("開始循環當前行");
  } else {
    loopStart.value = 0;
    loopEnd.value = 0;
    ElMessage.info("停止循環");
  }
};

const handleCopyLyrics = () => {
  // `navigator` 只能在客戶端使用
  if (true) {
    let result = "";
    for (const line of lyrics.value) {
      let combinedLyric = "";
      for (const lyric of line.lyrics) combinedLyric += `${lyric.ori}`;
      result += `${line.timestamp}${combinedLyric}\n`;
    }
    navigator.clipboard.writeText(result);
    ElMessage.success("複製成功");
  }
};

const handleKeyPress = (event) => {
  if (
    true &&
    (document.activeElement.tagName === "INPUT" ||
      document.activeElement.tagName === "TEXTAREA")
  ) {
    return;
  }
  switch (event.key.toLowerCase()) {
    case "a":
      goToPreviousLyric();
      break;
    case "d":
      goToNextLyric();
      break;
    case "s":
      toggleLoopCurrentLyric();
      break;
    case "z":
      skipBackward();
      break;
    case "x":
      togglePlayPause();
      break;
    case "c":
      skipForward();
      break;
  }
};

// 更新窗口寬度
const updateWindowWidth = () => {
  if (true) {
    windowWidth.value = window.innerWidth;
  }
};

// 調整寬度功能
const startResize = (event) => {
  if (!true) return;
  isResizing.value = true;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
  // 防止文字選取
  event.preventDefault();
};

const onResize = (event) => {
  if (!isResizing.value || !true) return;

  const container = document.querySelector(".lg\\:flex-row");
  if (!container) return;

  const containerRect = container.getBoundingClientRect();
  const newLeftWidth =
    ((event.clientX - containerRect.left) / containerRect.width) * 100;

  // 限制寬度在 20% 到 80% 之間
  if (newLeftWidth >= 20 && newLeftWidth <= 80) {
    leftWidth.value = newLeftWidth;
  }
};

const stopResize = () => {
  if (!true) return;
  isResizing.value = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);

  // 保存到 localStorage
  localStorage.setItem("myGojuon_leftWidth", JSON.stringify(leftWidth.value));
};

// onMounted 只在客戶端執行，是放置客戶端專用邏輯的最佳位置
onMounted(async () => {
  await fetchVideoData(uid);
  // 確保在客戶端環境下執行
  if (true) {
    // 初始化窗口寬度
    updateWindowWidth();
    // 監聽窗口大小變化
    window.addEventListener("resize", updateWindowWidth);

    // 載入本地存儲的設定
    const savedAutoPlayNext = localStorage.getItem("myGojuon_autoPlayNext");
    const savedPlaybackRate = localStorage.getItem("myGojuon_playbackRate");
    const savedAutoScroll = localStorage.getItem("myGojuon_autoScroll");
    const savedLeftWidth = localStorage.getItem("myGojuon_leftWidth");

    if (savedAutoPlayNext !== null) {
      autoPlayNext.value = JSON.parse(savedAutoPlayNext);
    }
    if (savedPlaybackRate !== null) {
      playbackRate.value = JSON.parse(savedPlaybackRate);
    }
    if (savedAutoScroll !== null) {
      autoScroll.value = JSON.parse(savedAutoScroll);
    }
    if (savedLeftWidth !== null) {
      leftWidth.value = JSON.parse(savedLeftWidth);
    }

    fetchAllVideos();

    // 監聽 YouTube API 是否準備就緒
    window.onYouTubeIframeAPIReady = () => {
      initializePlayer();
    };

    // 如果 API 已經載入，直接初始化
    if (window.YT && window.YT.Player) {
      initializePlayer();
    }

    window.addEventListener("keypress", handleKeyPress, true);
  }
});

onUnmounted(() => {
  if (true) {
    if (player) {
      player.destroy();
      player = null;
    }
    window.removeEventListener("keypress", handleKeyPress);
    window.removeEventListener("resize", updateWindowWidth);
    // 清理拖動事件監聽器
    document.removeEventListener("mousemove", onResize);
    document.removeEventListener("mouseup", stopResize);
    // onYouTubeIframeAPIReady 設為 null，避免組件卸載後觸發
    window.onYouTubeIframeAPIReady = null;
  }
});
</script>

<!-- <style> 區塊保持不變 -->
<style scoped>
@reference "tailwindcss";
/* ... 您的樣式 ... */
.gradient-text-tech-animated {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 1.5rem;
  letter-spacing: 0.5px;
  animation: gradient-animation 8s ease infinite;
}

@keyframes gradient-animation {
  0% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
  100% {
    background-position: 0% 50%;
  }
}

/* 防止拖動時選取文字 */
.cursor-col-resize {
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}
</style>

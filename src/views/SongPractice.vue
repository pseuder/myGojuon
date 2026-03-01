<template>
  <div class="flex h-full flex-col lg:overflow-hidden">
    <div
      v-if="currentVideo"
      class="flex h-full flex-col gap-4 px-4 py-4 pb-16 md:px-10 lg:flex-row lg:gap-0"
    >
      <!-- 影片播放器+功能列 -->
      <div
        class="flex h-full flex-col"
        :style="{ width: isMobile ? '100%' : `${songStore.leftWidth}%` }"
      >
        <div class="shrink-0">
          <!-- 影片標題＋作者 -->
          <div class="gradient-text-tech-animated font-bold text-2xl">
            {{ currentVideo.name }} - {{ currentVideo.artists }}
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
        <!-- <div class="flex shrink-0 flex-col gap-2">
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
                <el-input-number
                  v-model="songStore.playbackRate"
                  :precision="1"
                  :step="0.1"
                  :max="2"
                  :min="0.3"
                  @change="changePlaybackRate"
                />
              </div>
            </div>
          </div>

          <el-alert v-if="currentVideo.remark" type="success">
            <p class="w-[88%] wrap-break-word">
              {{ currentVideo.remark }}
            </p>
          </el-alert>
        </div> -->
      </div>

      <!-- 可拖動分隔線 (只在寬螢幕顯示) -->
      <div
        v-if="!isMobile"
        class="mr-1 ml-1 hidden w-1 shrink-0 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500 lg:flex"
        @mousedown="startResize"
      ></div>

      <!-- 歌詞  -->
      <el-scrollbar
        class="h-full overflow-x-auto"
        :style="{
          width: isMobile
            ? '100%'
            : `calc(${100 - songStore.leftWidth}% - 4px)`,
        }"
      >
        <div class="">
          <div
            v-for="(line, index) in lyrics"
            :key="index"
            :id="`lyric-${index}`"
            :class="{ 'bg-yellow-200': currentLyricIndex === index }"
            class="flex items-center gap-4 py-2"
          >
            <div class="flex shrink-0 items-center">
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
                    {{ songStore.display_mode === "both" ? ly.cvt : "" }}
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

    <!-- 載入中狀態 -->
    <div v-else class="flex h-full items-center justify-center">
      <p>Loading song...</p>
    </div>

    <!-- 下方固定影片控制bar -->
    <div v-if="currentVideo" class="control-bar px-2">
      <!-- Left: playback controls -->
      <div class="flex shrink-0 items-center gap-1">
        <el-button
          circle
          size="small"
          :title="t('previous_song')"
          @click="goToPreviousSong"
        >
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <el-button type="primary" circle @click="togglePlayPause">
          <el-icon :size="20">
            <VideoPause v-if="isPlaying" />
            <VideoPlay v-else />
          </el-icon>
        </el-button>
        <el-button
          circle
          size="small"
          :title="t('next_song')"
          @click="playNextSong"
        >
          <el-icon>
            <ArrowRight />
          </el-icon>
        </el-button>
      </div>

      <!-- Center: song info -->
      <div class="min-w-0 flex-1 px-2 text-center">
        <div
          class="flex flex-col md:flex-row justify-center font-bold text-shadow-sm truncate"
        >
          <div>{{ currentVideo.name }}</div>
          <div class="hidden md:block">-</div>
          <div>{{ currentVideo.artists }}</div>
        </div>
      </div>

      <!-- Right: mode controls -->
      <div class="flex shrink-0 items-center">
        <!-- Auto Scroll -->
        <el-button
          circle
          size="medium"
          :type="songStore.autoScroll ? 'warning ' : 'default'"
          :title="t('scrolling')"
          @click="songStore.autoScroll = !songStore.autoScroll"
        >
          <img src="/images/auto_scroll.svg" class="h-4 w-4" />
        </el-button>

        <!-- Play Mode (normal → loop → shuffle, mutually exclusive) -->
        <el-button
          type="warning"
          size="medium"
          :title="
            songStore.playMode === 'normal'
              ? t('auto_play_next_song')
              : songStore.playMode === 'loop'
                ? t('loop_song')
                : t('shuffle_playback')
          "
          @click="cyclePlayMode"
          circle
        >
          <img
            v-if="songStore.playMode === 'loop'"
            src="/images/replay.png"
            class="h-4 w-4"
          />
          <img
            v-else-if="songStore.playMode === 'shuffle'"
            src="/images/random.svg"
            class="h-4 w-4"
          />
          <img v-else src="/images/arrow-right.svg" class="h-4 w-4" />
        </el-button>

        <!-- Playlist drawer toggle -->
        <el-button
          type="warning"
          size="medium"
          :title="t('playlist_drawer')"
          @click="isPlaylistDrawerOpen = true"
          circle
        >
          <img src="/images/song-lyrics.png" class="h-4 w-4" />
        </el-button>
      </div>
    </div>

    <!-- Playlist Drawer -->
    <el-drawer
      v-model="isPlaylistDrawerOpen"
      :title="t('playlist_drawer')"
      direction="rtl"
      size="fit-content"
    >
      <div class="flex flex-col gap-1">
        <div
          v-for="(song, index) in playlist"
          :key="song.source_id"
          class="flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-gray-100"
          :class="{
            'bg-green-50 font-semibold text-green-600':
              song.source_id === videoId,
            'bg-orange-50':
              song.source_id === nextSongId && song.source_id !== videoId,
          }"
          @click="navigateToSong(song)"
        >
          <span class="w-6 shrink-0 text-right text-xs text-gray-400">{{
            index + 1
          }}</span>
          <div class="min-w-0 flex-1">
            <div class="truncate text-sm">{{ song.name }}</div>
            <div class="truncate text-xs text-gray-500">
              {{ song.artists }}
            </div>
          </div>
          <el-tag
            v-if="song.source_id === videoId"
            type="success"
            class="shrink-0 text-green-500"
            :title="t('play_next_song')"
            >Now</el-tag
          >

          <el-tag
            v-else-if="song.source_id === nextSongId"
            type="warning"
            class="shrink-0 text-orange-400"
            :title="t('play_next_song')"
            >Next</el-tag
          >
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import {
  VideoPause,
  VideoPlay,
  Right,
  ArrowLeft,
  ArrowRight,
  Refresh,
  Sort,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "@/composables/useApi.js";

/*-- store --*/
import { useSongStore } from "@/stores/index.js";
const songStore = useSongStore();

const { t } = useI18n();
const MYAPI = useApi();
const router = useRouter();
const route = useRoute();
const localePath = (p) => p;

const videoId = computed(() => route.params.uid);
const uid = route.params.uid;
const videoData = ref(null);
const currentVideo = computed(() => videoData.value);

// 動態 meta title
watch(
  currentVideo,
  (video) => {
    if (video) {
      document.title = `${video.name} - ${video.artists} | ${t("meta.title")}`;
    }
  },
  { immediate: true },
);

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

const fetchVideoData = async (id) => {
  if (!id) return;
  try {
    const response = await MYAPI.get(`/get_song/${id}`);
    if (response.data) {
      videoData.value = response.data;
    }
  } catch (err) {
    console.error("Error fetching video data:", err);
  }
};

/*-- 歌手歌曲列表與自動播下一首 --*/
const playlist = ref([]);

const fetchplaylist = async () => {
  try {
    const params = { artist_id: currentVideo.value?.artist_id || "" };
    const res = await MYAPI.get("/get_playlist", params);
    playlist.value = res.data;
  } catch (error) {
    console.error("Error fetching all videos:", error);
    ElMessage.error("無法獲取所有歌曲列表");
    playlist.value = [];
  }
};

const currentVideoIndexInArtistList = computed(() => {
  if (!currentVideo.value || !playlist.value.length) return -1;
  return playlist.value.findIndex((v) => v.source_id === videoId.value);
});

const playNextSong = () => {
  // 單曲循環：直接重播當前歌曲
  if (isLoopingSong.value) {
    if (player && player.seekTo) {
      player.seekTo(0);
      player.playVideo();
    }
    return;
  }

  if (currentVideoIndexInArtistList.value === -1) {
    if (player && player.seekTo) player.seekTo(0);
    return;
  }

  let nextSong = null;

  if (songStore.playMode === "shuffle") {
    // 隨機模式：使用預計算的下一首索引
    if (nextShuffleIndex.value < 0) computeShuffleNextIndex();
    nextSong = playlist.value[nextShuffleIndex.value] ?? null;
  } else {
    const nextIndex = currentVideoIndexInArtistList.value + 1;
    if (nextIndex < playlist.value.length) {
      nextSong = playlist.value[nextIndex];
    }
  }

  if (nextSong) {
    // 直接在現有播放器中換片，保留自動播放權限（避免背景/行動裝置被封鎖）
    if (player && player.loadVideoById) {
      player.loadVideoById(nextSong.source_id);
      player.setPlaybackRate(songStore.playbackRate);
    }

    // 標記為自動換歌，讓 watcher 跳過 initializePlayer()
    isAutoNavigating.value = true;

    // 更新網址（保留瀏覽歷史）並更新歌詞資料
    router.push(localePath(`/SongPractice/${nextSong.source_id}`));
    currentLyricIndex.value = -1;
    isLooping.value = false;
    fetchVideoData(nextSong.source_id);
  } else {
    if (player && player.seekTo) player.seekTo(0);
  }
};

/*-- 歌手歌曲列表導航 (上一首) --*/
const goToPreviousSong = () => {
  if (currentVideoIndexInArtistList.value <= 0) {
    ElMessage.info(t("previous_song") + ": " + (playlist.value[0]?.name ?? ""));
    return;
  }
  const prevSong = playlist.value[currentVideoIndexInArtistList.value - 1];
  ElMessage.info(`${t("previous_song")}: ${prevSong.name}`);
  if (player && player.loadVideoById) {
    player.loadVideoById(prevSong.source_id);
    player.setPlaybackRate(songStore.playbackRate);
  }
  isAutoNavigating.value = true;
  router.push(localePath(`/SongPractice/${prevSong.source_id}`));
  currentLyricIndex.value = -1;
  isLooping.value = false;
  fetchVideoData(prevSong.source_id);
};

/*-- 播放模式循環切換 (normal → loop → shuffle → normal) --*/
const cyclePlayMode = () => {
  if (songStore.playMode === "normal") {
    songStore.playMode = "loop";
    ElMessage.success(t("loop_song"));
  } else if (songStore.playMode === "loop") {
    songStore.playMode = "shuffle";
    computeShuffleNextIndex();
    ElMessage.success(t("shuffle_playback"));
  } else {
    songStore.playMode = "normal";
    ElMessage.success(t("auto_play_next_song"));
  }
};

/*-- 從播放列表 Drawer 跳轉歌曲 --*/
const navigateToSong = (song) => {
  if (song.source_id === videoId.value) {
    isPlaylistDrawerOpen.value = false;
    return;
  }
  // ElMessage.info(`${t("play_next_song")}: ${song.name}`);
  if (player && player.loadVideoById) {
    player.loadVideoById(song.source_id);
    player.setPlaybackRate(songStore.playbackRate);
  }
  isAutoNavigating.value = true;
  router.push(localePath(`/SongPractice/${song.source_id}`));
  currentLyricIndex.value = -1;
  isLooping.value = false;
  fetchVideoData(song.source_id);
  isPlaylistDrawerOpen.value = false;
};

/*-- 播放器狀態與設定 --*/
const isPlaying = ref(false);
const isAutoNavigating = ref(false);

/*-- Bottom Control Bar State --*/
const isLoopingSong = computed(() => songStore.playMode === "loop");
const isPlaylistDrawerOpen = ref(false);

/*-- Shuffle 下一首預計算 --*/
const nextShuffleIndex = ref(-1);

const computeShuffleNextIndex = () => {
  if (!playlist.value.length) {
    nextShuffleIndex.value = -1;
    return;
  }
  if (playlist.value.length === 1) {
    nextShuffleIndex.value = 0;
    return;
  }
  const currIdx = currentVideoIndexInArtistList.value;
  let idx;
  do {
    idx = Math.floor(Math.random() * playlist.value.length);
  } while (idx === currIdx);
  nextShuffleIndex.value = idx;
};

// 依照當前模式計算「下一首」的 source_id
const nextSongId = computed(() => {
  if (!playlist.value.length || currentVideoIndexInArtistList.value === -1)
    return null;
  if (songStore.playMode === "normal") {
    const nextIndex = currentVideoIndexInArtistList.value + 1;
    return nextIndex < playlist.value.length
      ? playlist.value[nextIndex].source_id
      : null;
  }
  if (songStore.playMode === "shuffle" && nextShuffleIndex.value >= 0) {
    return playlist.value[nextShuffleIndex.value]?.source_id ?? null;
  }
  return null; // loop 模式：同一首，不額外標記
});

/*-- 歌詞同步與循環播放 --*/
const currentLyricIndex = ref(-1);
const isLooping = ref(false);
const loopStart = ref(0);
const loopEnd = ref(0);

const parseTimeToSeconds = (timeString) => {
  if (!timeString) return 0;
  const match = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (match) {
    return parseInt(match[1]) * 60 + parseFloat(match[2]);
  }
  return 0;
};

const updateCurrentLyric = () => {
  if (
    !player ||
    typeof player.getCurrentTime !== "function" ||
    lyrics.value.length === 0
  )
    return;

  const currentTime = player.getCurrentTime();

  // 循環播放檢查
  if (isLooping.value && loopEnd.value > 0 && currentTime >= loopEnd.value) {
    player.seekTo(loopStart.value);
    return;
  }

  // 更新當前歌詞索引
  for (let i = 0; i < lyrics.value.length; i++) {
    const lineStartTime = parseTimeToSeconds(lyrics.value[i].timestamp);
    const nextLineStartTime =
      i < lyrics.value.length - 1
        ? parseTimeToSeconds(lyrics.value[i + 1].timestamp)
        : player.getDuration() || Infinity;

    if (currentTime >= lineStartTime && currentTime < nextLineStartTime) {
      if (currentLyricIndex.value !== i) {
        currentLyricIndex.value = i;
        if (songStore.autoScroll) scrollToCurrentLyric(i);
      }
      break;
    }
  }
};

const scrollToCurrentLyric = (index) => {
  const lyricElement = document.getElementById(`lyric-${index}`);
  if (lyricElement) {
    lyricElement.scrollIntoView({ behavior: "smooth", block: "center" });
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

/*-- 播放器操作（播放、暫停、跳轉、速率） --*/
const playerRef = ref(null);
let player = null;

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

const changePlaybackRate = () => {
  if (player && player.setPlaybackRate) {
    player.setPlaybackRate(songStore.playbackRate);
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
    player.seekTo(Math.max(0, player.getCurrentTime() - 3));
  }
};

const skipForward = () => {
  if (player && player.getCurrentTime && player.seekTo) {
    const duration = player.getDuration ? player.getDuration() : Infinity;
    player.seekTo(Math.min(duration, player.getCurrentTime() + 3));
  }
};

/*-- YouTube Player 初始化 --*/
const initializePlayer = () => {
  if (
    typeof window.YT === "undefined" ||
    typeof window.YT.Player === "undefined"
  ) {
    setTimeout(initializePlayer, 100);
    return;
  }
  if (!playerRef.value) return;

  if (player) {
    player.destroy();
    player = null;
  }

  player = new window.YT.Player(playerRef.value, {
    videoId: videoId.value,
    height: "100%",
    width: "100%",
    playerVars: { autoplay: 1, playsinline: 1 },
    events: {
      onReady: (event) => {
        setInterval(updateCurrentLyric, 100);
        event.target.setPlaybackRate(songStore.playbackRate);
      },
      onStateChange: (event) => {
        isPlaying.value = event.data === window.YT.PlayerState.PLAYING;
        if (event.data === window.YT.PlayerState.ENDED) {
          playNextSong();
        }
      },
      onError: (event) => {
        console.error("YouTube Player Error:", event.data);
        ElMessage.error(`播放器錯誤: ${event.data}`);
      },
    },
  });
};

/*-- 鍵盤快捷鍵 --*/
const handleKeyPress = (event) => {
  if (
    document.activeElement.tagName === "INPUT" ||
    document.activeElement.tagName === "TEXTAREA"
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

/*-- 版面拖拉調整（左右寬度） --*/
const isResizing = ref(false);
const windowWidth = ref(0);
const isMobile = computed(() => windowWidth.value < 1024);

const updateWindowWidth = () => {
  windowWidth.value = window.innerWidth;
};

const startResize = (event) => {
  isResizing.value = true;
  document.addEventListener("mousemove", onResize);
  document.addEventListener("mouseup", stopResize);
  event.preventDefault();
};

const onResize = (event) => {
  if (!isResizing.value) return;
  const container = document.querySelector(".lg\\:flex-row");
  if (!container) return;
  const containerRect = container.getBoundingClientRect();
  const newLeftWidth =
    ((event.clientX - containerRect.left) / containerRect.width) * 100;
  if (newLeftWidth >= 20 && newLeftWidth <= 80) {
    songStore.leftWidth = newLeftWidth;
  }
};

const stopResize = () => {
  isResizing.value = false;
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
};

/*-- Watchers（監聽狀態變化並同步 localStorage） --*/
watch(videoId, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    if (isAutoNavigating.value) {
      // 自動換歌已透過 loadVideoById 處理，不需重建播放器
      isAutoNavigating.value = false;
      // 換歌後重新預計算下一首（shuffle 模式）
      if (songStore.playMode === "shuffle") {
        computeShuffleNextIndex();
      }
      return;
    }
    currentLyricIndex.value = -1;
    isLooping.value = false;
    await fetchVideoData(newId);
    await fetchplaylist();
    initializePlayer();
  }
});

/*-- 生命週期（初始化 & 清理） --*/
onMounted(async () => {
  await fetchVideoData(uid);

  updateWindowWidth();
  window.addEventListener("resize", updateWindowWidth);
  window.addEventListener("keypress", handleKeyPress, true);

  fetchplaylist();

  // 初始化 YouTube Player
  window.onYouTubeIframeAPIReady = () => {
    initializePlayer();
  };
  if (window.YT && window.YT.Player) {
    initializePlayer();
  }
});

onUnmounted(() => {
  if (player) {
    player.destroy();
    player = null;
  }
  window.removeEventListener("keypress", handleKeyPress);
  window.removeEventListener("resize", updateWindowWidth);
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  window.onYouTubeIframeAPIReady = null;
});
</script>

<style scoped>
@reference "tailwindcss";
.control-bar {
  @apply fixed 
  bottom-0 
  left-0 
  right-0 
  h-16 
  z-50 
  flex 
  gap-2 
  items-center 
  justify-between 
  bg-white/70 
  border-t
  border-gray-200 
  backdrop-blur-md;
}

.gradient-text-tech-animated {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
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

:deep(.el-drawer__header) {
  margin-bottom: 0px;
}
</style>

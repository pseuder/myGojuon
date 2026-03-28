<template>
  <div
    class="flex h-[85vh] flex-col lg:h-[80vh] lg:overflow-hidden"
    id="myElement"
  >
    <div
      v-if="currentVideo"
      class="flex h-full flex-col gap-4 px-4 py-8 md:flex-row md:px-10 lg:gap-0"
    >
      <!-- 影片播放器+功能列 -->
      <div
        class="flex h-full flex-col"
        :style="{ width: isMobile ? '100%' : `${songStore.leftWidth}%` }"
      >
        <div class="shrink-0">
          <!-- 影片標題＋作者 -->
          <div class="gradient-text-tech-animated text-2xl font-bold">
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
        <div class="mt-2 flex shrink-0 flex-col gap-2">
          <el-alert v-if="currentVideo.remark" type="success">
            <p class="w-[88%] wrap-break-word">
              {{ currentVideo.remark }}
            </p>
          </el-alert>

          <div class="flex h-full w-full flex-col items-center gap-2">
            <div class="flex w-full flex-row items-center gap-2">
              <!-- 速度調整 -->
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

              <!-- 我的最愛 -->
              <el-button
                circle
                size="small"
                :type="
                  authStore.isLoggedIn &&
                  playlistStore.isFavorite(currentVideo.source_id)
                    ? 'danger'
                    : ''
                "
                :disabled="!authStore.isLoggedIn"
                @click="handleToggleFavorite"
              >
                <el-icon>
                  <StarFilled
                    v-if="
                      authStore.isLoggedIn &&
                      playlistStore.isFavorite(currentVideo.source_id)
                    "
                  />
                  <Star v-else />
                </el-icon>
              </el-button>

              <!-- 加入自訂清單 -->
              <el-dropdown
                trigger="hover"
                :disabled="!authStore.isLoggedIn"
                @command="
                  (cmd) => {
                    if (cmd === '__new__') {
                      handleAddToPlaylist(cmd);
                    } else if (
                      playlistStore.isInPlaylist(cmd, currentVideo.source_id)
                    ) {
                      handleRemoveFromPlaylist(cmd);
                    } else {
                      handleAddToPlaylist(cmd);
                    }
                  }
                "
              >
                <el-button
                  circle
                  size="small"
                  :disabled="!authStore.isLoggedIn"
                >
                  <el-icon><Plus /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="__new__">
                      <el-icon><FolderAdd /></el-icon>
                      {{ t("create_playlist") }}
                    </el-dropdown-item>
                    <el-dropdown-item
                      divided
                      v-if="playlistStore.customPlaylists.length === 0"
                      disabled
                    >
                      {{ t("no_playlists_yet") }}
                    </el-dropdown-item>
                    <template
                      v-for="pl in playlistStore.customPlaylists"
                      :key="pl.playlist_id"
                    >
                      <el-dropdown-item
                        v-if="pl.name != 'My Favorite'"
                        :command="pl.playlist_id"
                        :class="{
                          'in-playlist': playlistStore.isInPlaylist(
                            pl.playlist_id,
                            currentVideo.source_id,
                          ),
                        }"
                      >
                        <el-icon><Headset /></el-icon>
                        {{ pl.name }}
                        <span class="ml-1 text-xs text-gray-400"
                          >({{ pl.songs.length }})</span
                        >
                      </el-dropdown-item>
                    </template>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
          </div>
        </div>
      </div>

      <!-- 可拖動分隔線 (只在寬螢幕顯示) -->
      <div
        v-if="!isMobile"
        class="mr-1 ml-1 hidden w-1 shrink-0 cursor-col-resize items-center justify-center bg-gray-200 transition-colors hover:bg-blue-500 lg:flex"
        @mousedown="startResize"
      ></div>

      <!-- 歌詞  -->
      <el-scrollbar
        ref="lyricsScrollbarRef"
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
            <div class="anchor-button flex shrink-0 items-center">
              <el-icon
                @click="handleStartVideoClick(line.timestamp)"
                :size="25"
                title="跳轉到此"
                color="#409efc"
                class="hover:cursor-pointer"
              >
                <Right />
              </el-icon>
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

    <!-- 下方固定影片控制bar -->
    <div
      v-if="currentVideo"
      class="fixed right-0 bottom-0 left-0 z-50 flex h-16 items-center justify-between gap-2 border-t border-gray-200 bg-white/70 px-2 backdrop-blur-md"
    >
      <!-- Left: playback controls -->
      <div class="flex shrink-0 items-center gap-0">
        <el-button
          type="primary"
          @click="goToPreviousSong"
          :title="t('previous_song')"
          circle
          plain
        >
          <el-icon>
            <ArrowLeft />
          </el-icon>
        </el-button>
        <el-button
          v-show="isPlaying"
          type="primary"
          class="text-2xl"
          :icon="VideoPause"
          @click="togglePlayPause"
          circle
        />
        <el-button
          v-show="!isPlaying"
          type="primary"
          class="text-2xl"
          :icon="VideoPlay"
          @click="togglePlayPause"
          circle
        />
        <el-button
          type="primary"
          @click="playNextSong"
          :title="t('next_song')"
          circle
          plain
        >
          <el-icon>
            <ArrowRight />
          </el-icon>
        </el-button>
      </div>

      <!-- Center: song info -->
      <div
        class="flex min-w-0 flex-1 flex-col items-center justify-center px-2"
      >
        <div
          class="marquee-wrapper w-full"
          ref="marqueeRef"
          :class="{ 'text-center': !shouldMarquee }"
        >
          <div :class="{ 'is-marquee': shouldMarquee }">
            <span
              class="marquee-item font-bold text-shadow-sm"
              :class="{ 'pr-10': shouldMarquee }"
            >
              {{ currentVideo.name }}
            </span>
            <span
              v-if="shouldMarquee"
              class="marquee-item pr-10 font-bold text-shadow-sm"
              aria-hidden="true"
            >
              {{ currentVideo.name }}
            </span>
          </div>
        </div>
        <div class="w-full truncate text-center text-sm opacity-70">
          {{ currentVideo.artists }}
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
            v-show="songStore.playMode === 'loop'"
            src="/images/replay.png"
            class="h-4 w-4"
          />
          <img
            v-show="songStore.playMode === 'shuffle'"
            src="/images/random.svg"
            class="h-4 w-4"
          />
          <img
            v-show="songStore.playMode === 'normal'"
            src="/images/arrow-right.svg"
            class="h-4 w-4"
          />
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

    <!-- 建立清單 Dialog -->
    <el-dialog
      v-model="showCreatePlaylistDialog"
      :title="t('create_playlist')"
      width="320px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="newPlaylistName"
        :placeholder="t('enter_playlist_name')"
        @keyup.enter="handleCreatePlaylist"
        maxlength="30"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showCreatePlaylistDialog = false">{{
          t("cancel")
        }}</el-button>
        <el-button
          type="primary"
          :disabled="!newPlaylistName.trim()"
          @click="handleCreatePlaylist"
        >
          {{ t("confirm") }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Playlist Drawer -->
    <el-drawer
      v-model="isPlaylistDrawerOpen"
      :title="t('playlist_drawer')"
      direction="rtl"
      size="fit-content"
    >
      <div class="flex w-[40vw] flex-col gap-1 md:w-[30vw] lg:w-[20vw]">
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
          <template v-if="song.source_id === videoId">
            <el-badge
              value="Now"
              type="success"
              class="w-full shrink-0"
              :title="t('play_next_song')"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm">{{ song.song_name }}</div>
                <div class="truncate text-xs text-gray-500">
                  {{ song.artists }}
                </div>
              </div>
            </el-badge>
          </template>
          <template v-else-if="song.source_id === nextSongId">
            <el-badge
              value="Next"
              type="warning"
              class="w-full shrink-0"
              :title="t('play_next_song')"
            >
              <div class="min-w-0 flex-1">
                <div class="truncate text-sm">{{ song.song_name }}</div>
                <div class="truncate text-xs text-gray-500">
                  {{ song.artists }}
                </div>
              </div>
            </el-badge>
          </template>
          <template v-else>
            <div class="min-w-0 flex-1">
              <div class="truncate text-sm">{{ song.song_name }}</div>
              <div class="truncate text-xs text-gray-500">
                {{ song.artists }}
              </div>
            </div>
          </template>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from "vue";
import {
  VideoPause,
  VideoPlay,
  Right,
  ArrowLeft,
  ArrowRight,
  Refresh,
  Sort,
  Star,
  StarFilled,
  Plus,
  FolderAdd,
  Headset,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useI18n } from "vue-i18n";
import { useRouter, useRoute } from "vue-router";
import { useApi } from "@/composables/useApi.js";

/*-- store --*/
import {
  useSongStore,
  usePlaylistStore,
  useAuthStore,
} from "@/stores/index.js";
const songStore = useSongStore();
const playlistStore = usePlaylistStore();
const authStore = useAuthStore();

const { t } = useI18n();
const MYAPI = useApi();
const router = useRouter();
const route = useRoute();
const localePath = (p) => p;

const videoId = computed(() => route.params.uid);
const uid = route.params.uid;
const videoData = ref(null);
const currentVideo = computed(() => videoData.value);

const isLoading = ref(false);

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
  } catch (error) {
    console.log(error);
    if (error.message === "Network Error") {
      ElMessage.error(t("network_error"));
    } else {
      ElMessage.error(t("unexpect_error"));
    }
  }
};

/*-- 歌手歌曲列表與自動播下一首 --*/
const playlist = ref([]);

const fetchplaylist = async () => {
  const fromParam = route.query.from;

  if (fromParam === "favorites" || fromParam === "playlist") {
    try {
      if (!playlistStore.isInitialized) {
        await playlistStore.fetchPlaylists();
      }
      if (fromParam === "favorites") {
        playlist.value = [...playlistStore.favorites];
      } else {
        const playlistId = route.query.playlist_id;
        const pl = playlistStore.customPlaylists.find(
          (p) => String(p.playlist_id) === String(playlistId),
        );
        playlist.value = pl ? [...pl.songs] : [];
      }
    } catch (error) {
      console.error("Error fetching playlist:", error);
      playlist.value = [];
    }
    shufflePool.value = [];
    playHistory.value = [];
    if (songStore.playMode === "shuffle") {
      computeShuffleNextIndex();
    }
    return;
  }

  try {
    const params = { artist_id: currentVideo.value?.artist_id || "" };
    const res = await MYAPI.get("/get_artist_songs", params);
    playlist.value = res.data;
  } catch (error) {
    console.error("Error fetching all videos:", error);
    playlist.value = [];
  }
  // playlist 更新後重置 shuffle 池、歷史紀錄，並預計算下一首
  shufflePool.value = [];
  playHistory.value = [];
  if (songStore.playMode === "shuffle") {
    computeShuffleNextIndex();
  }
};

// 保留 playlist 上下文 query params 的路徑產生器
const buildSongPath = (sourceId) => {
  const base = localePath(`/SongPractice/${sourceId}`);
  const from = route.query.from;
  const playlistId = route.query.playlist_id;
  if (from === "favorites") return `${base}?from=favorites`;
  if (from === "playlist" && playlistId)
    return `${base}?from=playlist&playlist_id=${playlistId}`;
  return base;
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
    // 記錄當前歌曲到歷史，供「上一首」回溯
    playHistory.value.push(videoId.value);

    // 直接在現有播放器中換片，保留自動播放權限（避免背景/行動裝置被封鎖）
    if (player && player.loadVideoById) {
      player.loadVideoById(nextSong.source_id);
      player.setPlaybackRate(songStore.playbackRate);
    }

    // 標記為自動換歌，讓 watcher 跳過 initializePlayer()
    isAutoNavigating.value = true;

    // 更新網址（保留瀏覽歷史）並更新歌詞資料
    router.push(buildSongPath(nextSong.source_id));
    currentLyricIndex.value = -1;
    isLooping.value = false;
    scrollLyricsToTop();
    fetchVideoData(nextSong.source_id);
  } else {
    if (player && player.seekTo) player.seekTo(0);
  }
};

/*-- 歌手歌曲列表導航 (上一首) --*/
const goToPreviousSong = () => {
  if (playHistory.value.length === 0) {
    // ElMessage.info(t("previous_song") + ": " + (playlist.value[0]?.song_name ?? ""));
    return;
  }
  const prevId = playHistory.value.pop();
  const prevSong = playlist.value.find((s) => s.source_id === prevId);
  if (!prevSong) {
    ElMessage.warning(t("previous_song") + ": 找不到歌曲");
    return;
  }
  if (player && player.loadVideoById) {
    player.loadVideoById(prevSong.source_id);
    player.setPlaybackRate(songStore.playbackRate);
  }
  isAutoNavigating.value = true;
  router.push(buildSongPath(prevSong.source_id));
  currentLyricIndex.value = -1;
  isLooping.value = false;
  scrollLyricsToTop();
  fetchVideoData(prevSong.source_id);
  if (songStore.playMode === "shuffle") {
    computeShuffleNextIndex();
  }
};

/*-- 播放模式循環切換 (normal → loop → shuffle → normal) --*/
const cyclePlayMode = () => {
  if (songStore.playMode === "normal") {
    songStore.playMode = "loop";
    // ElMessage.success(t("loop_song"));
  } else if (songStore.playMode === "loop") {
    songStore.playMode = "shuffle";
    shufflePool.value = []; // 清空舊池，讓下次重新填充
    computeShuffleNextIndex();
    // ElMessage.success(t("shuffle_playback"));
  } else {
    songStore.playMode = "normal";
    // ElMessage.success(t("auto_play_next_song"));
  }
};

/*-- 從播放列表 Drawer 跳轉歌曲 --*/
const navigateToSong = (song) => {
  if (song.source_id === videoId.value) {
    isPlaylistDrawerOpen.value = false;
    return;
  }
  // 記錄當前歌曲到歷史，供「上一首」回溯
  playHistory.value.push(videoId.value);
  // ElMessage.info(`${t("play_next_song")}: ${song.name}`);
  if (player && player.loadVideoById) {
    player.loadVideoById(song.source_id);
    player.setPlaybackRate(songStore.playbackRate);
  }
  isAutoNavigating.value = true;
  router.push(buildSongPath(song.source_id));
  currentLyricIndex.value = -1;
  isLooping.value = false;
  scrollLyricsToTop();
  fetchVideoData(song.source_id);
  isPlaylistDrawerOpen.value = false;
};

/*-- 歌詞 scrollbar ref --*/
const lyricsScrollbarRef = ref(null);
const scrollLyricsToTop = () => {
  const lyricElement = document.getElementById(`lyric-0`);
  if (lyricElement) {
    lyricElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

/*-- 播放器狀態與設定 --*/
const isPlaying = ref(false);
const isAutoNavigating = ref(false);

/*-- Bottom Control Bar State --*/
const isLoopingSong = computed(() => songStore.playMode === "loop");
const isPlaylistDrawerOpen = ref(false);

/*-- Marquee --*/
const marqueeRef = ref(null);
const shouldMarquee = ref(false);

const checkMarquee = async () => {
  await nextTick();
  if (!marqueeRef.value) return;
  const span = marqueeRef.value.querySelector("span");
  if (span) {
    shouldMarquee.value = span.offsetWidth > marqueeRef.value.clientWidth;
  }
};

watch(currentVideo, checkMarquee);

/*-- 我的最愛 & 自訂清單 --*/
const showCreatePlaylistDialog = ref(false);
const newPlaylistName = ref("");
const pendingAddVideo = ref(null);

const handleToggleFavorite = async () => {
  try {
    await playlistStore.toggleFavorite(currentVideo.value.source_id);
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

const handleAddToPlaylist = async (command) => {
  if (command === "__new__") {
    pendingAddVideo.value = currentVideo.value;
    newPlaylistName.value = "";
    showCreatePlaylistDialog.value = true;
    return;
  }
  try {
    const result = await playlistStore.addSongToCustomPlaylist(
      command,
      currentVideo.value.source_id,
    );
    ElMessage.success(result?.message);
  } catch (error) {
    console.error("Error adding to playlist:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
  }
};

const handleRemoveFromPlaylist = async (playlistId) => {
  try {
    const result = await playlistStore.removeSongFromCustomPlaylist(
      playlistId,
      currentVideo.value.source_id,
    );
    ElMessage.success(result?.message);
  } catch (error) {
    console.error("Error removing from playlist:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
  }
};

const handleCreatePlaylist = async () => {
  if (!newPlaylistName.value.trim()) return;
  try {
    const pl = await playlistStore.createPlaylist(newPlaylistName.value);
    if (pendingAddVideo.value) {
      await playlistStore.addSongToCustomPlaylist(
        pl.playlist_id,
        pendingAddVideo.value.source_id,
      );
      pendingAddVideo.value = null;
      ElMessage({ type: "success", message: t("added_to_playlist") });
    } else {
      ElMessage({ type: "success", message: t("playlist_created") });
    }
    newPlaylistName.value = "";
    showCreatePlaylistDialog.value = false;
  } catch (error) {
    console.error("Error creating playlist:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage === "playlist_already_exists") {
      ElMessage({ type: "error", message: t("playlist_already_exists") });
    } else {
      ElMessage({ type: "error", message: t("error_loading_data") });
    }
  }
};

/*-- 播放歷史記錄（用於「上一首」正確回溯） --*/
const playHistory = ref([]); // source_id 堆疊，記錄每次切換的來源歌曲

/*-- Shuffle 下一首預計算（剩餘池算法） --*/
const nextShuffleIndex = ref(-1);
const shufflePool = ref([]); // 尚未播放的索引池

const refillShufflePool = () => {
  const currIdx = currentVideoIndexInArtistList.value;
  shufflePool.value = playlist.value
    .map((_, i) => i)
    .filter((i) => i !== currIdx);
};

const computeShuffleNextIndex = () => {
  if (!playlist.value.length) {
    nextShuffleIndex.value = -1;
    return;
  }
  if (playlist.value.length === 1) {
    nextShuffleIndex.value = 0;
    return;
  }
  // 池空了就重新填充（新一輪）
  if (!shufflePool.value.length) {
    refillShufflePool();
  }
  // 從池中隨機取出一個索引
  const pickPos = Math.floor(Math.random() * shufflePool.value.length);
  nextShuffleIndex.value = shufflePool.value[pickPos];
  shufflePool.value.splice(pickPos, 1);
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
  checkMarquee();
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
    scrollLyricsToTop();
    await fetchVideoData(newId);
    await fetchplaylist();
    initializePlayer();
  }
});

/*-- 生命週期（初始化 & 清理） --*/
// Swipe from right edge to open Playlist Drawer
let touchStartX = 0;
let touchStartY = 0;

const handleTouchStart = (e) => {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
};

const handleTouchEnd = (e) => {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  const screenWidth = window.innerWidth;
  // 從右側 30px 內往左滑超過 60px，且水平移動量大於垂直
  if (
    touchStartX > screenWidth - 30 &&
    dx < -60 &&
    Math.abs(dx) > Math.abs(dy)
  ) {
    isPlaylistDrawerOpen.value = true;
  }
};

onMounted(async () => {
  isLoading.value = true;

  await fetchVideoData(uid);
  checkMarquee();

  updateWindowWidth();
  window.addEventListener("resize", updateWindowWidth);
  window.addEventListener("keypress", handleKeyPress, true);
  window.addEventListener("touchstart", handleTouchStart, { passive: true });
  window.addEventListener("touchend", handleTouchEnd, { passive: true });

  fetchplaylist();

  // 初始化 YouTube Player
  window.onYouTubeIframeAPIReady = () => {
    initializePlayer();
  };
  if (window.YT && window.YT.Player) {
    initializePlayer();
  }

  isLoading.value = false;
});

onUnmounted(() => {
  if (player) {
    player.destroy();
    player = null;
  }
  window.removeEventListener("keypress", handleKeyPress);
  window.removeEventListener("resize", updateWindowWidth);
  window.removeEventListener("touchstart", handleTouchStart);
  window.removeEventListener("touchend", handleTouchEnd);
  document.removeEventListener("mousemove", onResize);
  document.removeEventListener("mouseup", stopResize);
  window.onYouTubeIframeAPIReady = null;
});
</script>

<style scoped>
@reference "tailwindcss";

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

.marquee-wrapper {
  overflow: hidden;
  white-space: nowrap;
}

.marquee-item {
  display: inline-block;
}

.is-marquee {
  display: inline-block;
  animation: marquee-scroll 12s linear infinite;
}

@keyframes marquee-scroll {
  0% {
    transform: translateX(0);
  }
  100% {
    transform: translateX(-50%);
  }
}

:deep(.in-playlist),
:deep(.in-playlist:hover) {
  background-color: #ecf5ff !important;
  color: #409eff !important;
}

:deep(.el-button:not(.is-disabled):hover),
:deep(.el-button:not(.is-disabled):focus) {
  background-color: var(--el-button-bg-color) !important;
  border-color: var(--el-button-border-color) !important;
  color: var(--el-button-text-color) !important;
}
</style>

<template>
  <div class="flex h-[88vh] w-full flex-col p-2 lg:h-full">
    <el-tabs
      v-model="activeTabName"
      type="border-card"
      class="song-overview-tabs flex h-full flex-col overflow-hidden"
      @tab-remove="handleCloseArtistTab"
    >
      <!-- ===== Tab 1: 歌手 ===== -->
      <el-tab-pane :label="t('artists')" name="artists">
        <div
          class="flex w-full flex-1 flex-wrap content-start justify-center gap-4 overflow-y-auto p-2 h-full"
        >
          <template v-if="isLoading && allArtists.length === 0">
            <div
              v-for="i in 6"
              :key="`skeleton-artist-${i}`"
              class="flex flex-col"
            >
              <el-card class="h-52 w-80 p-0 md:w-96" shadow="hover">
                <el-skeleton animated>
                  <template #template>
                    <el-skeleton-item variant="image" class="h-52 w-full" />
                  </template>
                </el-skeleton>
              </el-card>
              <el-skeleton animated class="mt-2">
                <template #template>
                  <el-skeleton-item variant="text" class="w-48" />
                </template>
              </el-skeleton>
            </div>
          </template>
          <template v-else v-for="artist in allArtists" :key="artist.artist_id">
            <div
              class="flex cursor-pointer flex-col hover:scale-105"
              @click="handleArtistSelect(artist.artist_id, artist.name)"
            >
              <el-card class="h-52 w-80 p-0 md:w-96" shadow="hover">
                <img
                  :src="`/thumbnails/${artist.name}.jpg`"
                  class="h-full w-full"
                  :alt="artist.name"
                  style="object-fit: cover; object-position: top"
                />
              </el-card>
              <div class="text-lg font-bold">
                {{ artist.name }} - {{ artist.song_count }} {{ t("songs") }}
              </div>
            </div>
          </template>
        </div>
      </el-tab-pane>

      <!-- ===== Tab 2: 我的清單 ===== -->
      <el-tab-pane :label="t('my_playlists')" name="playlists">
        <!-- 未登入提示 -->
        <div
          v-if="!authStore.isLoggedIn"
          class="flex h-full flex-col items-center justify-center gap-4 text-gray-400"
        >
          <el-icon class="text-6xl"><StarFilled /></el-icon>
          <p class="text-lg">{{ t("login_to_use_playlist") }}</p>
        </div>

        <!-- 查看清單內歌曲 -->
        <div
          v-else-if="selectedPlaylist"
          class="flex h-full flex-col overflow-hidden"
        >
          <!-- 返回按鈕 -->
          <div
            class="mb-4 flex flex-none items-center gap-4 border-b border-gray-200 py-2 dark:border-gray-700"
          >
            <el-button @click="selectedPlaylist = null" type="primary" plain>
              <el-icon><Back /></el-icon>
            </el-button>
            <h2 class="gradient-text-tech mx-auto text-2xl font-bold">
              {{ selectedPlaylist.name }}
            </h2>
            <el-button class="invisible"
              ><el-icon><Back /></el-icon
            ></el-button>
          </div>

          <!-- 清單內歌曲 -->
          <el-space
            v-if="selectedPlaylistSongs.length > 0"
            class="w-full flex-1 justify-center overflow-x-hidden overflow-y-auto"
            wrap
          >
            <VideoCard
              v-for="video in selectedPlaylistSongs"
              :key="video.source_id"
              :video="video"
              :url="resolvePlaylistVideoUrl(video.source_id)"
              @toggle-favorite="handleToggleFavorite"
              @add-to-playlist="handleAddToPlaylist"
              @remove-from-playlist="handleRemoveFromPlaylist"
            />
          </el-space>

          <div
            v-else
            class="flex flex-1 items-center justify-center text-gray-400"
          >
            {{ t("empty_playlist") }}
          </div>
        </div>

        <!-- 播放清單總覽 -->
        <div
          v-else-if="authStore.isLoggedIn"
          class="flex h-full flex-col overflow-hidden"
        >
          <!-- 標題列 -->
          <div class="mb-4 flex flex-none items-center justify-between">
            <span
              class="text-base font-semibold text-gray-600 dark:text-gray-300"
              >{{ t("my_playlists") }}</span
            >
            <el-button type="primary" @click="showCreatePlaylistDialog = true">
              <el-icon class="mr-1"><Plus /></el-icon>
              {{ t("create_playlist") }}
            </el-button>
          </div>

          <!-- 清單卡片 grid -->
          <div
            class="flex w-full flex-1 flex-wrap content-start justify-center gap-4 overflow-y-auto p-2"
          >
            <!-- 我的最愛 (固定第一個) -->
            <div
              class="flex cursor-pointer flex-col hover:scale-105"
              @click="openFavoritesPlaylist"
            >
              <el-card class="h-52 w-80 p-0 md:w-96" shadow="hover">
                <div
                  class="flex h-full w-full items-center justify-center bg-linear-to-br from-red-100 to-pink-200 dark:from-red-900 dark:to-pink-900"
                >
                  <el-icon class="text-8xl text-red-400"
                    ><StarFilled
                  /></el-icon>
                </div>
              </el-card>
              <div class="mt-1 text-lg font-bold">
                {{ t("my_favorites") }} — {{ playlistStore.favorites.length }}
                {{ t("songs") }}
              </div>
            </div>

            <!-- 自訂清單 -->
            <template
              v-for="pl in playlistStore.customPlaylists"
              :key="pl.playlist_id"
            >
              <div v-if="pl.name !== 'My Favorite'" class="flex flex-col">
                <el-card
                  class="relative h-52 w-80 cursor-pointer p-0 hover:scale-105 md:w-96"
                  shadow="hover"
                  @click="openCustomPlaylist(pl)"
                >
                  <div
                    class="flex h-full w-full items-center justify-center bg-linear-to-br from-blue-100 to-indigo-200 dark:from-blue-900 dark:to-indigo-900"
                  >
                    <el-icon class="text-8xl text-blue-400"
                      ><Headset
                    /></el-icon>
                  </div>
                  <!-- 操作按鈕 (右上角) -->
                  <div class="absolute right-2 top-2 flex gap-1" @click.stop>
                    <el-button
                      circle
                      size="small"
                      type="warning"
                      @click="openRenameDialog(pl)"
                    >
                      <el-icon><Edit /></el-icon>
                    </el-button>
                    <el-button
                      circle
                      size="small"
                      type="danger"
                      @click="handleDeletePlaylist(pl.playlist_id)"
                    >
                      <el-icon><Delete /></el-icon>
                    </el-button>
                  </div>
                </el-card>
                <div class="mt-1 text-lg font-bold">
                  {{ pl.name }} — {{ pl.songs.length }} {{ t("songs") }}
                </div>
              </div>
            </template>

            <!-- 空清單提示 -->
            <div
              v-if="playlistStore.customPlaylists.length === 0"
              class="w-full pt-8 text-center text-gray-400"
            >
              {{ t("no_playlists_yet") }}
            </div>
          </div>
        </div>
      </el-tab-pane>

      <!-- ===== Tab 3: 歌手歌曲 (dynamic, closable) ===== -->
      <el-tab-pane
        v-if="artistTab"
        :label="artistTab.name"
        name="artist-detail"
        :closable="true"
      >
        <div class="flex h-full flex-col overflow-hidden">
          <!-- Sorting controls -->
          <div class="mb-2 flex gap-4">
            <el-input
              v-model="queryInput"
              class="grow"
              :placeholder="t('search_placeholder')"
              clearable
            />

            <button
              @click="toggleSort('views')"
              class="flex shrink-0 items-center gap-1 rounded px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{ 'bg-gray-100 dark:bg-gray-700': sortBy === 'views' }"
            >
              <span>{{ t("views") }}</span>
              <span class="flex flex-col text-xs leading-none">
                <span
                  :class="{
                    'text-blue-500': sortBy === 'views' && sortOrder === 'desc',
                  }"
                  >▲</span
                >
                <span
                  :class="{
                    'text-blue-500': sortBy === 'views' && sortOrder === 'asc',
                  }"
                  >▼</span
                >
              </span>
            </button>

            <button
              @click="toggleSort('publish_date')"
              class="flex shrink-0 items-center gap-1 rounded px-3 py-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
              :class="{
                'bg-gray-100 dark:bg-gray-700': sortBy === 'publish_date',
              }"
            >
              <span>{{ t("publish_date") }}</span>
              <span class="flex flex-col text-xs leading-none">
                <span
                  :class="{
                    'text-blue-500':
                      sortBy === 'publish_date' && sortOrder === 'desc',
                  }"
                  >▲</span
                >
                <span
                  :class="{
                    'text-blue-500':
                      sortBy === 'publish_date' && sortOrder === 'asc',
                  }"
                  >▼</span
                >
              </span>
            </button>
          </div>

          <!-- Video cards -->
          <el-space
            class="w-full flex-1 justify-center overflow-x-hidden overflow-y-auto"
            wrap
          >
            <template v-if="isLoading && allVideos.length === 0">
              <el-card
                v-for="i in 8"
                :key="`skeleton-video-${i}`"
                class="h-fit w-80 md:w-96"
                shadow="hover"
              >
                <div class="p-4">
                  <el-skeleton animated>
                    <template #template>
                      <el-skeleton-item variant="image" class="h-48 w-full" />
                      <div class="mt-4">
                        <el-skeleton-item variant="text" class="w-full" />
                      </div>
                      <div class="mt-2 flex gap-2">
                        <el-skeleton-item variant="text" class="w-16" />
                        <el-skeleton-item variant="text" class="w-20" />
                      </div>
                    </template>
                  </el-skeleton>
                </div>
              </el-card>
            </template>

            <template
              v-else
              v-for="video in sortedVideos"
              :key="video.source_id"
            >
              <VideoCard
                :video="video"
                :url="resolveVideoUrl(video.source_id)"
                @toggle-favorite="handleToggleFavorite"
                @add-to-playlist="handleAddToPlaylist"
                @remove-from-playlist="handleRemoveFromPlaylist"
              />
            </template>
          </el-space>
        </div>
      </el-tab-pane>
    </el-tabs>

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

    <!-- 改名 Dialog -->
    <el-dialog
      v-model="showRenameDialog"
      :title="t('new_playlist_name')"
      width="320px"
      :close-on-click-modal="false"
    >
      <el-input
        v-model="renameInput"
        :placeholder="t('enter_playlist_name')"
        @keyup.enter="handleRenamePlaylist"
        maxlength="30"
        show-word-limit
      />
      <template #footer>
        <el-button @click="showRenameDialog = false">{{
          t("cancel")
        }}</el-button>
        <el-button
          type="primary"
          :disabled="!renameInput.trim()"
          @click="handleRenamePlaylist"
        >
          {{ t("confirm") }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Back,
  StarFilled,
  Plus,
  Delete,
  Edit,
  Headset,
} from "@element-plus/icons-vue";
import VideoCard from "@/components/VideoCard.vue";

/*-- router --*/
const router = useRouter();
const route = useRoute();
const localePath = (p) => p;

/*-- i18n --*/
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

/*-- API --*/
import { useApi } from "@/composables/useApi.js";
const MYAPI = useApi();

/*-- Playlist Store --*/
import { usePlaylistStore, useAuthStore } from "@/stores";
const playlistStore = usePlaylistStore();
const authStore = useAuthStore();

// --- 歌手/歌曲資料 ---
const allVideos = ref([]);
const allArtists = ref([]);
const selectedArtist = ref(null);
const isLoading = ref(true);

// --- Tab 狀態 ---
const activeTabName = ref("artists"); // 'artists' | 'artist-detail' | 'playlists'
const artistTab = ref(null); // { name: string, artist_id: string } | null

// --- 我的清單分頁狀態 ---
const selectedPlaylist = ref(null);
const showCreatePlaylistDialog = ref(false);
const newPlaylistName = ref("");
const showRenameDialog = ref(false);
const renameInput = ref("");
const renamingPlaylistId = ref(null);

// 當前選中清單的歌曲列表 (computed)
const selectedPlaylistSongs = computed(() => {
  if (!selectedPlaylist.value) return [];
  if (selectedPlaylist.value.type === "favorites") {
    return playlistStore.favorites;
  }
  const pl = playlistStore.customPlaylists.find(
    (p) => p.playlist_id === selectedPlaylist.value.playlist_id,
  );
  return pl ? pl.songs : [];
});

// 輔助函式: 解析路由
const resolveVideoUrl = (source_id) => {
  return localePath("/SongPractice/" + source_id);
};

// 輔助函式: 解析路由（帶 playlist 上下文，供清單內歌曲使用）
const resolvePlaylistVideoUrl = (source_id) => {
  const base = "/SongPractice/" + source_id;
  if (!selectedPlaylist.value) return localePath(base);
  if (selectedPlaylist.value.type === "favorites") {
    return localePath(base + "?from=favorites");
  }
  if (
    selectedPlaylist.value.type === "custom" &&
    selectedPlaylist.value.playlist_id
  ) {
    return localePath(
      base + `?from=playlist&playlist_id=${selectedPlaylist.value.playlist_id}`,
    );
  }
  return localePath(base);
};

/*-- 紀錄滾動位置 --*/
const artistListScrollPosition = ref(0);

/*-- 過濾&排序 --*/
const queryInput = ref("");
const sortBy = ref(null);
const sortOrder = ref("desc");

const filteredVideos = computed(() => {
  if (!queryInput.value.trim()) {
    return allVideos.value;
  }
  const searchTerm = queryInput.value.toLowerCase().trim();
  return allVideos.value.filter((video) => {
    const nameMatch = video.song_name?.toLowerCase().includes(searchTerm);
    const tagsMatch = video.tags?.toLowerCase().includes(searchTerm);
    return nameMatch || tagsMatch;
  });
});

const sortedVideos = computed(() => {
  const videos = [...filteredVideos.value];

  if (!sortBy.value) {
    return videos;
  }

  if (sortBy.value === "views") {
    videos.sort((a, b) => {
      const viewsA = parseInt(a.views) || 0;
      const viewsB = parseInt(b.views) || 0;
      return sortOrder.value === "desc" ? viewsB - viewsA : viewsA - viewsB;
    });
  } else if (sortBy.value === "publish_date") {
    videos.sort((a, b) => {
      const dateA = new Date(a.publish_date || 0);
      const dateB = new Date(b.publish_date || 0);
      return sortOrder.value === "desc" ? dateB - dateA : dateA - dateB;
    });
  }

  return videos;
});

// Event: 排序
const toggleSort = (field) => {
  if (sortBy.value === field) {
    if (sortOrder.value === "desc") {
      sortOrder.value = "asc";
    } else {
      sortBy.value = null;
      sortOrder.value = "desc";
    }
  } else {
    sortBy.value = field;
    sortOrder.value = "desc";
  }
};

// Event: 點擊歌手
const handleArtistSelect = async (artistId, artistName) => {
  const artistListContainer = document.querySelector(
    ".el-tab-pane[aria-labelledby] .overflow-y-auto",
  );
  if (artistListContainer) {
    artistListScrollPosition.value = artistListContainer.scrollTop;
  }

  const artistIdStr = String(artistId);
  artistTab.value = { name: artistName, artist_id: artistIdStr };
  activeTabName.value = "artist-detail";

  selectedArtist.value = artistIdStr;
  router.push({ query: { artist: artistIdStr } });
  allVideos.value = [];
  await fetchVideos();
};

// Event: 關閉歌手 Tab
const handleCloseArtistTab = async () => {
  artistTab.value = null;
  allVideos.value = [];
  selectedArtist.value = null;
  activeTabName.value = "artists";
  router.push({ query: {} });

  await nextTick();
  const artistListContainer = document.querySelector(
    ".song-overview-tabs .el-tab-pane .overflow-y-auto",
  );
  if (artistListContainer && artistListScrollPosition.value > 0) {
    artistListContainer.scrollTop = artistListScrollPosition.value;
  }
};

// 獲取某歌手所有影片
const fetchVideos = async () => {
  isLoading.value = true;
  const params = {};
  if (selectedArtist.value) {
    params.artist_id = selectedArtist.value;
  }

  try {
    if (allArtists.value.length === 0) {
      const artistRes = await MYAPI.get("/get_artists_list");
      allArtists.value = artistRes.data;
    }

    if (selectedArtist.value) {
      const videoRes = await MYAPI.get("/get_artist_songs", params);
      if (videoRes["status"] == "success") {
        allVideos.value = videoRes["data"];
      } else {
        ElMessage({
          type: videoRes["status"],
          message: videoRes["message"],
        });
      }
    } else {
      allVideos.value = [];
    }
  } catch (error) {
    console.error("Error fetching data:", error);
    ElMessage({
      type: "error",
      message: t("error_loading_data"),
    });
  } finally {
    isLoading.value = false;
  }
};

// ===== 歌單 Events =====

// Event: 切換我的最愛
const handleToggleFavorite = async (video) => {
  try {
    const result = await playlistStore.toggleFavorite(video);
  } catch (error) {
    console.error("Error toggling favorite:", error);
  }
};

// Event: 加入自訂清單
const handleAddToPlaylist = async (command, video) => {
  if (command === "__new__") {
    pendingAddVideo.value = video;
    newPlaylistName.value = "";
    showCreatePlaylistDialog.value = true;
    return;
  }
  let playlistID = command;
  try {
    const result = await playlistStore.addSongToCustomPlaylist(
      playlistID,
      video.source_id,
    );
  } catch (error) {
    console.error("Error adding to playlist:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
  }
};

const handleRemoveFromPlaylist = async (playlistId, video) => {
  try {
    await playlistStore.removeSongFromCustomPlaylist(
      playlistId,
      video.source_id,
    );
  } catch (error) {
    console.error("Error removing from playlist:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
  }
};

// 暫存從「加入清單下拉」觸發的「建立新清單並加入」的歌曲
const pendingAddVideo = ref(null);

// Event: 建立清單
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

// Event: 刪除清單
const handleDeletePlaylist = (playlistId) => {
  ElMessageBox.confirm(t("confirm_delete_playlist"), t("warning"), {
    confirmButtonText: t("confirm"),
    cancelButtonText: t("cancel"),
    type: "warning",
  })
    .then(async () => {
      try {
        await playlistStore.deletePlaylist(playlistId);
        ElMessage({ type: "success", message: t("playlist_deleted") });
      } catch (error) {
        console.error("Error deleting playlist:", error);
        ElMessage({ type: "error", message: t("error_loading_data") });
      }
    })
    .catch(() => {});
};

// Event: 開啟改名 Dialog
const openRenameDialog = (pl) => {
  renamingPlaylistId.value = pl.playlist_id;
  renameInput.value = pl.name;
  showRenameDialog.value = true;
};

// Event: 改名清單
const handleRenamePlaylist = async () => {
  if (!renameInput.value.trim()) return;
  try {
    await playlistStore.renamePlaylist(
      renamingPlaylistId.value,
      renameInput.value,
    );
    ElMessage({ type: "success", message: t("playlist_renamed") });
    showRenameDialog.value = false;
    renamingPlaylistId.value = null;
  } catch (error) {
    console.error("Error renaming playlist:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
  }
};

// Event: 點擊「我的最愛」卡片
const openFavoritesPlaylist = () => {
  selectedPlaylist.value = { type: "favorites", name: t("my_favorites") };
};

// Event: 點擊自訂清單卡片
const openCustomPlaylist = (pl) => {
  selectedPlaylist.value = {
    type: "custom",
    playlist_id: pl.playlist_id,
    name: pl.name,
  };
};

onMounted(async () => {
  const artist_id = route.query.artist;
  if (artist_id) {
    selectedArtist.value = artist_id;
    activeTabName.value = "artist-detail";
    // 歌手名稱從 allArtists 取得，先用 id 暫代
    artistTab.value = { name: artist_id, artist_id: String(artist_id) };
  }
  await Promise.all([fetchVideos(), playlistStore.fetchPlaylists()]);
  // 取得歌手名稱後更新 tab 標題
  if (artist_id && allArtists.value.length > 0) {
    const found = allArtists.value.find(
      (a) => String(a.artist_id) === String(artist_id),
    );
    if (found) {
      artistTab.value = { name: found.name, artist_id: String(artist_id) };
    }
  }
});

onUnmounted(() => {});
</script>

<style scoped>
.gradient-text-tech {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  animation: gradient-animation 8s ease infinite;
  font-weight: bold;
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

:deep(.el-card__body) {
  height: 100%;
  width: 100%;
  padding: 0px;
}

/* Make el-tabs fill available height */
.song-overview-tabs {
  display: flex;
  flex-direction: column;
}

:deep(.song-overview-tabs .el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

:deep(.song-overview-tabs .el-tab-pane) {
  height: 100%;
  overflow: hidden;
}
</style>

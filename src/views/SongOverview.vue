<template>
  <div class="flex h-[88vh] w-full flex-col p-2 lg:h-full">
    <!-- 主分頁: 歌手 / 我的清單 -->
    <div class="mb-2 flex-none border-b border-gray-200 dark:border-gray-700">
      <div class="flex gap-1">
        <button
          @click="handleMainTabChange('artists')"
          class="rounded-t px-4 py-2 text-sm font-semibold transition-colors"
          :class="
            mainTab === 'artists'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
        >
          {{ t("artists") }}
        </button>
        <button
          @click="handleMainTabChange('playlists')"
          class="rounded-t px-4 py-2 text-sm font-semibold transition-colors"
          :class="
            mainTab === 'playlists'
              ? 'border-b-2 border-blue-500 text-blue-500'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          "
        >
          {{ t("my_playlists") }}
        </button>
      </div>
    </div>

    <!-- ===== 歌手分頁 ===== -->
    <template v-if="mainTab === 'artists'">
      <!-- 指定歌手歌曲頁面 -->
      <div class="mb-4 flex-none">
        <div
          v-if="activeTab !== 'all'"
          class="flex items-center gap-4 border-b border-gray-200 py-2 dark:border-gray-700"
        >
          <el-button @click="handleBackToAll" type="primary" plain>
            <el-icon class=""><Back /></el-icon>
          </el-button>
          <h2 class="gradient-text-tech mx-auto text-2xl font-bold">
            {{ currentArtistName || "" }}
          </h2>
          <el-button class="invisible">
            <el-icon class=""><ArrowLeft /></el-icon>
          </el-button>
        </div>
        <el-tabs
          v-else
          v-model="activeTab"
          @tab-change="handleTabChange"
          class="w-full"
        >
          <el-tab-pane label="ALL" name="all"> </el-tab-pane>
          <el-tab-pane
            v-for="artist in allArtists"
            :key="artist.artist_id"
            :label="artist.name"
            :name="String(artist.artist_id)"
          >
          </el-tab-pane>
        </el-tabs>
      </div>

      <!-- 全部歌手清單 -->
      <div
        class="flex w-full grow flex-col items-center gap-4 overflow-x-hidden"
      >
        <div
          v-if="activeTab === 'all'"
          class="flex w-full flex-1 flex-wrap content-start justify-center gap-4 overflow-y-auto p-2"
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

        <!-- Video list view -->
        <div v-else class="flex w-full flex-1 flex-col overflow-hidden">
          <!-- Sorting controls -->
          <div class="mb-2 flex gap-4">
            <el-input
              v-model="queryInput"
              calss="grow"
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

          <!-- Video cards container -->
          <el-space
            class="w-full flex-1 justify-center overflow-x-hidden overflow-y-auto"
            wrap
          >
            <!-- Skeleton loading for videos -->
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

            <!-- Actual video cards -->
            <template
              v-else
              v-for="video in sortedVideos"
              :key="video.source_id"
            >
              <el-card class="h-fit w-80 md:w-96" shadow="hover">
                <div class="p-4">
                  <a
                    :href="resolveVideoUrl(video.source_id)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mb-2 block w-full"
                  >
                    <img
                      :src="
                        'https://i.ytimg.com/vi/' +
                        video.source_id +
                        '/hqdefault.jpg'
                      "
                      class="h-48 w-full cursor-pointer object-cover"
                      alt="video thumbnail"
                    />
                  </a>

                  <a
                    :href="resolveVideoUrl(video.source_id)"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="mb-2 block w-full truncate text-lg text-blue-400 no-underline hover:text-blue-600 hover:underline"
                  >
                    {{ video.song_name }}
                  </a>

                  <!-- Video metadata: views and publish date -->
                  <div
                    class="mb-2 flex flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400"
                  >
                    <span v-if="video.views" class="flex items-center gap-1">
                      <el-tag type="info" effect="light" round>
                        {{ t("views") }}
                        {{ formatViews(video.views) }}
                      </el-tag>
                    </span>
                    <span
                      v-if="video.publish_date"
                      class="flex items-center gap-1"
                    >
                      <el-tag type="info" effect="light" round>
                        {{ t("publish_date") }}
                        {{ formatDate(video.publish_date) }}
                      </el-tag>
                    </span>
                  </div>

                  <div class="flex gap-2" v-if="video.tags">
                    <el-tag
                      v-for="tag in video.tags?.split(',')"
                      :key="tag"
                      type="success"
                      >{{ tag }}</el-tag
                    >
                  </div>

                  <!-- 歌單操作 icon -->
                  <div class="mt-3 flex items-center justify-end gap-2">
                    <!-- 我的最愛 -->
                    <el-tooltip
                      :content="
                        !authStore.isLoggedIn
                          ? t('login_required')
                          : playlistStore.isFavorite(video.source_id)
                            ? t('remove_from_favorites')
                            : t('add_to_favorites')
                      "
                      placement="top"
                    >
                      <el-button
                        circle
                        size="small"
                        :type="
                          authStore.isLoggedIn &&
                          playlistStore.isFavorite(video.source_id)
                            ? 'danger'
                            : ''
                        "
                        :disabled="!authStore.isLoggedIn"
                        @click.prevent="handleToggleFavorite(video.source_id)"
                      >
                        <el-icon>
                          <StarFilled
                            v-if="
                              authStore.isLoggedIn &&
                              playlistStore.isFavorite(video.source_id)
                            "
                          />
                          <Star v-else />
                        </el-icon>
                      </el-button>
                    </el-tooltip>

                    <!-- 加入自訂清單 -->
                    <el-tooltip
                      :content="
                        !authStore.isLoggedIn
                          ? t('login_required')
                          : t('add_to_playlist')
                      "
                      placement="top"
                    >
                      <el-dropdown
                        trigger="click"
                        :disabled="!authStore.isLoggedIn"
                        @command="(cmd) => handleAddToPlaylist(cmd, video)"
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
                            <el-dropdown-item
                              v-for="pl in playlistStore.customPlaylists"
                              :key="pl.playlist_id"
                              :command="pl.playlist_id"
                            >
                              <el-icon><Headset /></el-icon>
                              {{ pl.name }}
                              <span class="ml-1 text-xs text-gray-400"
                                >({{ pl.songs.length }})</span
                              >
                            </el-dropdown-item>
                          </el-dropdown-menu>
                        </template>
                      </el-dropdown>
                    </el-tooltip>
                  </div>
                </div>
              </el-card>
            </template>
          </el-space>
        </div>
      </div>
    </template>

    <!-- ===== 我的清單分頁 ===== -->
    <template v-else-if="mainTab === 'playlists'">
      <!-- 未登入提示 -->
      <div
        v-if="!authStore.isLoggedIn"
        class="flex flex-1 flex-col items-center justify-center gap-4 text-gray-400"
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
          <el-card
            v-for="video in selectedPlaylistSongs"
            :key="video.source_id"
            class="h-fit w-80 md:w-96"
            shadow="hover"
          >
            <div class="p-4">
              <a
                :href="resolvePlaylistVideoUrl(video.source_id)"
                target="_blank"
                rel="noopener noreferrer"
                class="mb-2 block w-full"
              >
                <img
                  :src="
                    'https://i.ytimg.com/vi/' +
                    video.source_id +
                    '/hqdefault.jpg'
                  "
                  class="h-48 w-full cursor-pointer object-cover"
                  alt="video thumbnail"
                />
              </a>
              <a
                :href="resolvePlaylistVideoUrl(video.source_id)"
                target="_blank"
                rel="noopener noreferrer"
                class="mb-2 block w-full truncate text-lg text-blue-400 no-underline hover:text-blue-600 hover:underline"
              >
                {{ video.song_name }}
              </a>
              <!-- 移除按鈕 -->
              <div class="mt-2 flex justify-end">
                <el-button
                  type="danger"
                  size="small"
                  plain
                  @click="handleRemoveFromSelectedPlaylist(video.source_id)"
                >
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>
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
                <el-icon class="text-8xl text-red-400"><StarFilled /></el-icon>
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
                  <el-icon class="text-8xl text-blue-400"><Headset /></el-icon>
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
    </template>

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
  ArrowLeft,
  Back,
  Star,
  StarFilled,
  Plus,
  Delete,
  Edit,
  FolderAdd,
  Headset,
} from "@element-plus/icons-vue";

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
const activeTab = ref("all");
const isLoading = ref(true);
const currentArtistName = ref("");

// --- 主分頁 ---
const mainTab = ref("artists"); // 'artists' | 'playlists'

// --- 我的清單分頁狀態 ---
// selectedPlaylist: null | { type: 'favorites'|'custom', id?, name }
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

// 輔助函式: 格式化觀看數
const formatViews = (views) => {
  const num = parseInt(views);
  if (isNaN(num)) return "0";

  if (num >= 100000000) {
    return (num / 100000000).toFixed(1) + "億";
  } else if (num >= 10000) {
    return (num / 10000).toFixed(1) + "萬";
  }
  return num.toLocaleString();
};

// 輔助函式: 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

// Event: 切換主分頁
const handleMainTabChange = (tab) => {
  mainTab.value = tab;
  selectedPlaylist.value = null;
};

// Event: 點擊歌手
const handleArtistSelect = (artistId, artistName) => {
  const artistListContainer = document.querySelector(
    ".flex.w-full.flex-1.flex-wrap.content-start.justify-center.gap-4.overflow-y-auto",
  );
  if (artistListContainer) {
    artistListScrollPosition.value = artistListContainer.scrollTop;
  }

  const artistIdStr = String(artistId);
  activeTab.value = artistIdStr;
  handleTabChange(artistIdStr);

  currentArtistName.value = artistName;
};

// Event: 點擊返回
const handleBackToAll = async () => {
  activeTab.value = "all";
  await handleTabChange("all");

  await nextTick();
  const artistListContainer = document.querySelector(
    ".flex.w-full.flex-1.flex-wrap.content-start.justify-center.gap-4.overflow-y-auto",
  );
  if (artistListContainer && artistListScrollPosition.value > 0) {
    artistListContainer.scrollTop = artistListScrollPosition.value;
  }
};

// Event: 點擊特定影片
const handleVideoClick = (source_id) => {
  const dataToSend = {
    source_id: source_id,
  };
};

// Event: 總攬/歌手頁面切換
const handleTabChange = async (tabName) => {
  if (tabName === "all") {
    selectedArtist.value = null;
    router.push({ query: {} });
  } else {
    selectedArtist.value = tabName;
    router.push({ query: { artist: tabName } });
  }
  allVideos.value = [];
  await fetchVideos();
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
    const message = await playlistStore.toggleFavorite(video);
    ElMessage({
      type: "success",
      message: message,
    });
  } catch (error) {
    console.error("Error toggling favorite:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
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
  try {
    const added = await playlistStore.addSongToPlaylist(command, video);
    ElMessage({
      type: added ? "success" : "warning",
      message: added ? t("added_to_playlist") : t("song_already_in_playlist"),
    });
  } catch (error) {
    console.error("Error adding to playlist:", error);
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
    // 如果是從歌曲卡片觸發的「建立新清單」，建立後自動加入
    if (pendingAddVideo.value) {
      await playlistStore.addSongToPlaylist(
        pl.playlist_id,
        pendingAddVideo.value,
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
    ElMessage({ type: "error", message: t("error_loading_data") });
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
    id: pl.playlist_id,
    name: pl.name,
  };
};

// Event: 從清單內移除歌曲
const handleRemoveFromSelectedPlaylist = async (sourceId) => {
  if (!selectedPlaylist.value) return;
  try {
    if (selectedPlaylist.value.type === "favorites") {
      await playlistStore.removeFavorite(sourceId);
      ElMessage({ type: "info", message: t("removed_from_favorites") });
    } else {
      await playlistStore.removeSongFromPlaylist(
        selectedPlaylist.value.playlist_id,
        sourceId,
      );
    }
  } catch (error) {
    console.error("Error removing song:", error);
    ElMessage({ type: "error", message: t("error_loading_data") });
  }
};

onMounted(async () => {
  // 並行載入：歌手/歌曲資料 + 使用者歌單
  const artist_id = route.query.artist;
  if (artist_id) {
    selectedArtist.value = artist_id;
    activeTab.value = artist_id;
  } else {
    activeTab.value = "all";
  }
  await Promise.all([fetchVideos(), playlistStore.fetchPlaylists()]);
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

.gradient-text-tech-animated :deep(.el-tabs__item) {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  /* 為了 Safari 瀏覽器 */
  background-clip: text;
  color: transparent;
  /* 文字顏色設為透明，顯示背景漸層 */
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

:deep(.el-tabs__content) {
  display: none;
}

.thumbnail-background::before {
  content: "";
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 变淡效果：50% 透明度的白色叠加层 */
  background-color: rgba(255, 255, 255, 0.2);
}

.thumbnail-text {
  position: relative;
  z-index: 2;
  /* 确保文字在半透明层之上 */

  color: white;
  /* 文字颜色设置为白色 */

  /* 使用 text-shadow 模拟黑框 (描边) */
  /* 设置四个方向的黑色阴影，偏移量和模糊半径为 0 */
  text-shadow:
    -1px -1px 0 #000,
    1px -1px 0 #000,
    -1px 1px 0 #000,
    1px 1px 0 #000;
}

:deep(.el-card__body) {
  height: 100%;
  width: 100%;
  padding: 0px;
}

:deep(.el-tabs__header) {
  display: none;
}
</style>

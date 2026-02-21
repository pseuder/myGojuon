<template>
  <div class="flex h-[88vh] w-full flex-col p-2 lg:h-full">
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
    <div class="flex w-full grow flex-col items-center gap-4 overflow-x-hidden">
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
          <template v-else v-for="video in sortedVideos" :key="video.source_id">
            <el-card class="h-fit w-80 md:w-96" shadow="hover">
              <div class="p-4">
                <a
                  :href="resolveVideoUrl(video.source_id)"
                  target="_blank"
                  rel="noopener noreferrer"
                  class="mb-2 block w-full"
                  @click="handleVideoClick(video.source_id)"
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
                  {{ video.name }}
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
              </div>
            </el-card>
          </template>
        </el-space>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Loading, ArrowLeft, Back } from "@element-plus/icons-vue";

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

const allVideos = ref([]);
const allArtists = ref([]);
const selectedArtist = ref(null);
const activeTab = ref("all");
const isLoading = ref(true);
const currentArtistName = ref("");

// 輔助函式: 解析路由
const resolveVideoUrl = (source_id) => {
  return localePath("/SongPractice/" + source_id);
};

// 輔助函式: 格式化觀看數
const formatViews = (views) => {
  const num = parseInt(views);
  if (isNaN(num)) return "0";

  if (num >= 100000000) {
    // 1億以上
    return (num / 100000000).toFixed(1) + "億";
  } else if (num >= 10000) {
    // 1萬以上
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
const sortBy = ref(null); // 'views' or 'publish_date'
const sortOrder = ref("desc"); // 'asc' or 'desc'

// 過濾後歌曲列表
const filteredVideos = computed(() => {
  if (!queryInput.value.trim()) {
    return allVideos.value;
  }
  const searchTerm = queryInput.value.toLowerCase().trim();
  return allVideos.value.filter((video) => {
    const nameMatch = video.name?.toLowerCase().includes(searchTerm);
    const tagsMatch = video.tags?.toLowerCase().includes(searchTerm);
    return nameMatch || tagsMatch;
  });
});

// 排序後歌曲列表
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
    // If clicking the same field, cycle through: desc -> asc -> null (original order)
    if (sortOrder.value === "desc") {
      sortOrder.value = "asc";
    } else {
      // Third click: reset to original order
      sortBy.value = null;
      sortOrder.value = "desc";
    }
  } else {
    // If clicking a different field, set it as sortBy and default to desc
    sortBy.value = field;
    sortOrder.value = "desc";
  }
};

// Event: 點擊歌手
const handleArtistSelect = (artistId, artistName) => {
  // Save scroll position before leaving artist list view
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

  // Restore scroll position after returning to artist list view
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

  // 發送數據到後端
  MYAPI.post("/record_song_activity", dataToSend).catch((error) => {
    console.error("Error recording activity:", error);
  });
};

// Event: 總攬/歌手頁面切換
const handleTabChange = async (tabName) => {
  if (tabName === "all") {
    selectedArtist.value = null;
    router.push({
      query: {},
    });
  } else {
    selectedArtist.value = tabName;
    router.push({
      query: {
        artist: tabName,
      },
    });
  }
  // Reset for new tab
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

onMounted(async () => {
  const artist_id = route.query.artist;
  if (artist_id) {
    selectedArtist.value = artist_id;
    activeTab.value = artist_id;
  } else {
    activeTab.value = "all";
  }
  await fetchVideos();
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

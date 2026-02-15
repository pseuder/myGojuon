<template>
  <div class="flex h-[88vh] w-full flex-col p-2 lg:h-full">
    <div class="mb-4 flex-none">
      <!-- Navigation header when viewing specific author -->
      <div
        v-if="activeTab !== 'all'"
        class="flex items-center gap-4 border-b border-gray-200 py-2 dark:border-gray-700"
      >
        <el-button @click="handleBackToAll" type="primary" plain>
          <el-icon class=""><Back /></el-icon>
        </el-button>
        <h2 class="gradient-text-tech mx-auto text-2xl font-bold">
          {{ currentAuthor?.name || "" }}
        </h2>
        <el-button class="invisible">
          <el-icon class=""><ArrowLeft /></el-icon>
        </el-button>
      </div>

      <!-- Tabs only shown when on ALL view -->
      <el-tabs
        v-else
        v-model="activeTab"
        @tab-change="handleTabChange"
        class="w-full"
      >
        <el-tab-pane label="ALL" name="all"> </el-tab-pane>
        <el-tab-pane
          v-for="author in allAuthors"
          :key="author.id"
          :label="author.name"
          :name="String(author.id)"
          :class="{ 'gradient-text-tech-animated': author.author == 'NELKE' }"
        >
        </el-tab-pane>
      </el-tabs>
    </div>

    <div class="flex w-full grow flex-col items-center gap-4 overflow-x-hidden">
      <!-- Author selection view -->
      <div
        v-if="activeTab === 'all'"
        class="flex w-full flex-1 flex-wrap content-start justify-center gap-4 overflow-y-auto p-2"
      >
        <!-- Skeleton loading for authors -->
        <template v-if="isLoading && allAuthors.length === 0">
          <div
            v-for="i in 6"
            :key="`skeleton-author-${i}`"
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

        <!-- Actual author cards -->
        <template v-else v-for="author in allAuthors" :key="author.id">
          <div
            class="flex cursor-pointer flex-col hover:scale-105"
            @click="handleAuthorSelect(author.id)"
          >
            <el-card class="h-52 w-80 p-0 md:w-96" shadow="hover">
              <img
                :src="`/thumbnails/${author.name}.jpg`"
                class="h-full w-full"
                :alt="author.name"
                style="object-fit: cover; object-position: top"
              />
            </el-card>
            <div class="text-lg font-bold">
              {{ author.name }} - {{ author.song_count }} {{ t("songs") }}
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
          ref="scrollContainer"
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

      <!-- Loading indicator for infinite scroll (only when loading more, not initial load) -->
      <div
        v-if="isLoading && activeTab !== 'all' && allVideos.length > 0"
        class="flex justify-center py-4"
      >
        <el-icon class="is-loading">
          <Loading />
        </el-icon>
        <span class="ml-2">{{ t("loading_more_videos") }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import { Loading, ArrowLeft, Back } from "@element-plus/icons-vue";

import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();
const localePath = (p) => p;

import { useApi } from "@/composables/useApi.js";
const MYAPI = useApi();

// 歌曲總覽頁面專屬 SEO Meta

// 添加結構化資料

const router = useRouter();
const route = useRoute();
const allVideos = ref([]);
const allAuthors = ref([]);
const selectedAuthor = ref(null);
const activeTab = ref("all");

const page_size = ref(10);
const page_number = ref(1);
const total = ref(0);
const hasMore = ref(true);
const queryInput = ref("");

const isLoading = ref(true);

// Sorting state
const sortBy = ref(null); // 'views' or 'publish_date'
const sortOrder = ref("desc"); // 'asc' or 'desc'

// Ref for scrollable container
const scrollContainer = ref(null);

// Store scroll position for author list
const authorListScrollPosition = ref(0);

// Computed property for current author
const currentAuthor = computed(() => {
  if (!activeTab.value || activeTab.value === "all") return null;
  return allAuthors.value.find(
    (author) => String(author.id) === String(activeTab.value),
  );
});

// Computed property for filtered videos based on search query
const filteredVideos = computed(() => {
  if (!queryInput.value.trim()) {
    return allVideos.value;
  }

  const searchTerm = queryInput.value.toLowerCase().trim();

  return allVideos.value.filter((video) => {
    // Search in video name
    const nameMatch = video.name?.toLowerCase().includes(searchTerm);

    // Search in tags (備註)
    const tagsMatch = video.tags?.toLowerCase().includes(searchTerm);

    return nameMatch || tagsMatch;
  });
});

// Computed property for sorted videos
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

// Toggle sort function
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

// Load more videos when scrolling to bottom
const loadMoreVideos = async () => {
  if (isLoading.value || !hasMore.value) {
    return;
  }

  page_number.value += 1;
  await fetchVideos(true);
};

// Scroll event handler for infinite scroll
const handleScroll = () => {
  if (!scrollContainer.value) return;

  const element = scrollContainer.value.$el;
  const scrollTop = element.scrollTop;
  const scrollHeight = element.scrollHeight;
  const clientHeight = element.clientHeight;

  // Trigger load more when user scrolls to within 100px of bottom
  const threshold = 100;
  if (scrollTop + clientHeight >= scrollHeight - threshold) {
    loadMoreVideos();
  }
};

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

const handleAuthorSelect = (authorId) => {
  // Save scroll position before leaving author list view
  const authorListContainer = document.querySelector(
    ".flex.w-full.flex-1.flex-wrap.content-start.justify-center.gap-4.overflow-y-auto",
  );
  if (authorListContainer) {
    authorListScrollPosition.value = authorListContainer.scrollTop;
  }

  const authorIdStr = String(authorId);
  activeTab.value = authorIdStr;
  handleTabChange(authorIdStr);
};

const handleBackToAll = async () => {
  activeTab.value = "all";
  await handleTabChange("all");

  // Restore scroll position after returning to author list view
  await nextTick();
  const authorListContainer = document.querySelector(
    ".flex.w-full.flex-1.flex-wrap.content-start.justify-center.gap-4.overflow-y-auto",
  );
  if (authorListContainer && authorListScrollPosition.value > 0) {
    authorListContainer.scrollTop = authorListScrollPosition.value;
  }
};

const handleVideoClick = (source_id) => {
  const dataToSend = {
    source_id: source_id,
  };

  // 發送數據到後端
  MYAPI.post("/record_song_activity", dataToSend).catch((error) => {
    console.error("Error recording activity:", error);
  });
};

const handleTabChange = async (tabName) => {
  if (tabName === "all") {
    selectedAuthor.value = null;
    router.push({
      query: {},
    });
  } else {
    selectedAuthor.value = tabName;
    router.push({
      query: {
        author: tabName,
      },
    });
  }
  // Reset for new tab
  page_number.value = 1;
  allVideos.value = [];
  hasMore.value = true;
  await fetchVideos();

  // Re-add scroll event listener after tab change
  await nextTick();
  if (scrollContainer.value) {
    const element = scrollContainer.value.$el;
    // Remove existing listener first to avoid duplicates
    element.removeEventListener("scroll", handleScroll);
    // Add the listener again
    element.addEventListener("scroll", handleScroll);
  }
};

const fetchVideos = async (isAppend = false) => {
  isLoading.value = true;

  // const params = {
  //   page_size: page_size.value,
  //   page_number: page_number.value,
  // };

  const params = {};

  if (selectedAuthor.value) {
    params.author_id = selectedAuthor.value;
  }

  try {
    // Fetch authors first if not already loaded
    if (allAuthors.value.length === 0) {
      const authorRes = await MYAPI.get("/get_all_authors");
      allAuthors.value = authorRes.data;
    }

    // If a specific author is selected, fetch their videos
    if (selectedAuthor.value) {
      const videoRes = await MYAPI.get("/get_all_videos", params);
      if (videoRes["status"] == "success") {
        const newVideos = videoRes.data.data;
        total.value = videoRes.data.total;

        if (isAppend) {
          allVideos.value = [...allVideos.value, ...newVideos];
        } else {
          allVideos.value = newVideos;
        }

        hasMore.value =
          newVideos.length === page_size.value &&
          allVideos.value.length < total.value;
      } else {
        ElMessage({
          type: videoRes["status"],
          message: videoRes["message"],
        });
      }
    } else {
      // When 'all' is selected, we don't fetch videos, just clear the list
      allVideos.value = [];
      total.value = 0;
      hasMore.value = false;
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
  const author_id = route.query.author;
  if (author_id) {
    selectedAuthor.value = author_id;
    activeTab.value = author_id;
  } else {
    activeTab.value = "all";
  }
  await fetchVideos();

  // Add scroll event listener for infinite scroll after DOM is ready
  await nextTick();
  if (scrollContainer.value) {
    const element = scrollContainer.value.$el;
    element.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  // Remove scroll event listener
  if (scrollContainer.value) {
    const element = scrollContainer.value.$el;
    element.removeEventListener("scroll", handleScroll);
  }
});
</script>

<style scoped>
@reference "tailwindcss";
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

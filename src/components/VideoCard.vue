<template>
  <el-card class="w-full sm:w-80 p-0 md:w-96" shadow="hover">
    <div class="p-4">
      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="mb-2 block w-full"
      >
        <img
          :src="'https://i.ytimg.com/vi/' + video.source_id + '/hqdefault.jpg'"
          class="h-48 w-full cursor-pointer object-cover"
          alt="video thumbnail"
        />
      </a>

      <a
        :href="url"
        target="_blank"
        rel="noopener noreferrer"
        class="mb-2 block w-full truncate text-lg text-blue-400 no-underline hover:text-blue-600 hover:underline"
      >
        {{ video.song_name }} - {{ video.artists }}
      </a>

      <!-- Video metadata: views and publish date -->
      <div
        class="mb-2 flex min-h-[28px] flex-wrap gap-2 text-sm text-gray-600 dark:text-gray-400"
      >
        <span v-if="video.views" class="flex items-center gap-1">
          <el-tag type="info" effect="light" round>
            {{ t("views") }} {{ formatViews(video.views) }}
          </el-tag>
        </span>
        <span v-if="video.publish_date" class="flex items-center gap-1">
          <el-tag type="info" effect="light" round>
            {{ t("publish_date") }} {{ formatDate(video.publish_date) }}
          </el-tag>
        </span>
      </div>

      <!-- 歌單操作 -->
      <div class="mt-3 flex items-center justify-end gap-2">
        <div class="grow">
          <el-tag
            v-for="tag in video.tags?.split(',') ?? []"
            :key="tag"
            :class="{
              'bg-transparent border-transparent': !video.tags,
            }"
            type="success"
            >{{ tag }}</el-tag
          >
        </div>

        <!-- 我的最愛 -->
        <span class="favorite-btn-wrapper">
          <el-button
            circle
            size="small"
            :type="
              authStore.isLoggedIn && playlistStore.isFavorite(video.source_id)
                ? 'danger'
                : ''
            "
            :disabled="!authStore.isLoggedIn"
            @click.prevent="emit('toggle-favorite', video.source_id)"
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
        </span>

        <!-- 加入自訂清單 -->

        <el-dropdown
          trigger="hover"
          :disabled="!authStore.isLoggedIn"
          @command="
            (cmd) => {
              if (cmd === '__new__') {
                emit('add-to-playlist', cmd, video);
              } else if (playlistStore.isInPlaylist(cmd, video.source_id)) {
                emit('remove-from-playlist', cmd, video);
              } else {
                emit('add-to-playlist', cmd, video);
              }
            }
          "
        >
          <el-button circle size="small" :disabled="!authStore.isLoggedIn">
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
                      video.source_id,
                    ),
                  }"
                >
                  <el-icon>
                    <Headset />
                  </el-icon>
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
  </el-card>
</template>

<script setup>
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { ElMessage } from "element-plus";
import {
  Star,
  StarFilled,
  Plus,
  FolderAdd,
  Headset,
  Check,
} from "@element-plus/icons-vue";
import { usePlaylistStore, useAuthStore } from "@/stores";

const props = defineProps({
  video: { type: Object, required: true },
  url: { type: String, required: true },
});

const emit = defineEmits([
  "toggle-favorite",
  "add-to-playlist",
  "remove-from-playlist",
]);

const { t } = useI18n();
const playlistStore = usePlaylistStore();
const authStore = useAuthStore();

const formatViews = (views) => {
  const num = parseInt(views);
  if (isNaN(num)) return "0";
  if (num >= 100000000) return (num / 100000000).toFixed(1) + "億";
  if (num >= 10000) return (num / 10000).toFixed(1) + "萬";
  return num.toLocaleString();
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};
</script>

<style scoped>
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

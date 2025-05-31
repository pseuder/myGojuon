<template>
  <div class="flex flex-col px-10 py-4 gap-4">
    <el-space class="w-full flex gap-4 items-center mb-4 select-none" wrap>
      <el-tag
        class="cursor-pointer text-blue-400 hover:underline hover:text-blue-600"
        @click="resetFilter"
      >
        全部
      </el-tag>
      <el-tag
        v-for="author in allAuthors"
        :key="author.author"
        class="cursor-pointer text-blue-400 hover:underline hover:text-blue-600"
        :class="[
          author.author === 'NELKE' ? 'gradient-text-tech-animated' : '',
        ]"
        @click="filterByAuthor(author.author)"
      >
        {{ author.author }}
      </el-tag>
    </el-space>
    <div class="flex gap-4 items-center">
      <el-space class="justify-center" style="width: 100%" wrap>
        <template v-for="video in filteredVideos" :key="video.UID">
          <el-card class="w-full max-w-[380px]" shadow="hover">
            <div class="p-4">
              <router-link
                class="text-lg text-blue-400 hover:underline hover:text-blue-600 block w-full mb-2 truncate"
                :to="{ name: 'songPractice', params: { id: video.video_id } }"
                target="_blank"
              >
                <img
                  :src="
                    'https://i.ytimg.com/vi/' +
                    video.video_id +
                    '/hqdefault.jpg'
                  "
                  class="w-full h-48 object-cover"
                  alt="video thumbnail"
                />
                {{ video.video_name }}
              </router-link>

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
</template>

<script setup>
import { ref, onMounted, computed } from "vue";
import { useRouter, useRoute } from "vue-router";
import axios from "@/utils/axios";

const router = useRouter();
const route = useRoute();
const allVideos = ref([]);
const allAuthors = ref([]);
const selectedAuthor = ref(null);

const filteredVideos = computed(() => {
  if (selectedAuthor.value) {
    return allVideos.value.filter(
      (video) => video.author === selectedAuthor.value
    );
  }
  return allVideos.value;
});

const navigateToPractice = (video) => {
  router.push({ name: "songPractice", params: { id: video.video_id } });
};

const filterByAuthor = (authorName) => {
  selectedAuthor.value = authorName;
  router.push({ query: { author: authorName } });
};

const resetFilter = () => {
  selectedAuthor.value = null;
  router.push({ query: {} });
};

const fetchVideos = async () => {
  const data = await axios.get("/get_all_videos");
  allVideos.value = data["videos"];
  allAuthors.value = data["authors"];
};

onMounted(() => {
  fetchVideos().then(() => {
    const author = route.query.author;
    if (author) {
      selectedAuthor.value = author;
    }
  });
});
</script>

<style scoped>
.gradient-text-tech-animated {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text; /* 為了 Safari 瀏覽器 */
  background-clip: text;
  color: transparent; /* 文字顏色設為透明，顯示背景漸層 */
  animation: gradient-animation 8s ease infinite;
  background-color: #ecf5ff; /* 指定背景顏色 */
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
</style>

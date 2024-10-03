<template>
  <div class="flex flex-col px-10 py-4 gap-4">
    <div class="flex gap-4 items-center">
      <el-space class="justify-center" style="width: 100%" wrap>
        <template v-for="video in allVideos" :key="video.UID">
          <el-card class="w-full max-w-[380px]" shadow="hover">
            <img
              :src="video.video_thumbnail"
              class="w-full h-48 object-cover"
              alt="video thumbnail"
            />
            <div class="p-4">
              <el-text
                class="cursor-pointer text-lg text-blue-400 hover:underline hover:text-blue-600 w-full mb-2"
                truncated
                @click="navigateToPractice(video)"
              >
                {{ video.video_name }}
              </el-text>
            </div>
          </el-card>
        </template>
      </el-space>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import axios from "@/utils/axios";

const router = useRouter();
const allVideos = ref([]);

const navigateToPractice = (video) => {
  router.push({ name: "songPractice", params: { id: video.video_id } });
};

const fetchVideos = async () => {
  const data = await axios.get("/get_video");
  allVideos.value = data;
};

onMounted(() => {
  fetchVideos();
});
</script>

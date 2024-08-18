<template>
  <div class="flex flex-col px-10 py-4 gap-4">
    <!-- 總攬頁面 -->
    <div v-show="currentDiv === 'overview'" key="overview">
      <div class="flex gap-4 items-center">
        <el-space wrap>
          <template v-for="video in allVideos" :key="video.UID">
            <el-card class="w-full max-w-[380px]" shadow="hover">
              <img
                :src="video.video_thumbnail"
                class="w-full h-48 object-cover"
                alt="video thumbnail"
              />
              <div class="p-4">
                <button
                  class="cursor-pointer text-lg text-blue-400 hover:underline hover:text-blue-600"
                  @click="
                    videoId = video.video_id;
                    switchToPractice(video);
                  "
                >
                  {{ video.video_name }}
                </button>
              </div>
            </el-card>
          </template>
        </el-space>
      </div>
    </div>

    <!-- 練習頁面 -->
    <div v-show="currentDiv === 'practice'" key="practice">
      <div class="text-3xl">
        <img
          src="/images/music-solid.svg"
          alt="回到音樂總覽"
          class="w-8 h-8 cursor-pointer"
          @click="currentDiv = 'overview'"
        />
      </div>
      <div id="player" ref="playerRef"></div>
      <div class="flex flex-col gap-4">
        <span class="text-3xl">歌詞</span>
        <div
          v-for="(line, index) in parsedLyrics"
          :key="index"
          class="flex items-center gap-4"
          :class="{ 'bg-yellow-200': currentLyricIndex === index }"
        >
          <el-button type="primary" @click="jumpToTime(line.time)" plain>
            {{ formatTime(line.time) }}
          </el-button>
          <span>{{ line.text }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from "vue";
import axios from "@/utils/axios";

const videoId = ref("x1FV6IrjZCY");
const prevVideoId = ref("");

const playerRef = ref(null);
let player = null;
const currentDiv = ref("overview");

const allVideos = ref([]);
const currentLyricIndex = ref(-1);
const lyrics = ref("");
const parsedLyrics = computed(() => {
  return lyrics.value
    .split("\n")
    .filter((line) => {
      const trimmedLine = line.trim();
      return (
        trimmedLine !== "" &&
        trimmedLine.startsWith("[") &&
        trimmedLine.includes("]") &&
        !trimmedLine.startsWith("[length:") &&
        !trimmedLine.startsWith("[re:") &&
        !trimmedLine.startsWith("[ve:")
      );
    })
    .map((line) => {
      const [time, text] = line.split("]");
      const seconds = parseTimeToSeconds(time.slice(1));
      return { time: seconds, text: text.trim() };
    })
    .sort((a, b) => a.time - b.time);
});

const jumpToTime = (time) => {
  if (player) {
    player.seekTo(time);
  }
};

const parseTimeToSeconds = (timeString) => {
  const [minutes, seconds] = timeString.split(":").map(Number);
  return minutes * 60 + seconds;
};

const formatTime = (seconds) => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs
    .toString()
    .padStart(2, "0")}`;
};

const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT) {
      resolve();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = resolve;
    }
  });
};

const initializePlayer = async () => {
  await loadYouTubeAPI();
  player = new YT.Player(playerRef.value, {
    videoId: videoId.value,
    height: "390",
    width: "100%",
    playerVars: {
      autoplay: 0,
      playsinline: 1,
    },
    events: {
      onReady: (event) => {
        console.log("Player is ready");
        setInterval(updateCurrentLyric, 100); // Check every 100ms
      },
    },
  });
  prevVideoId.value = videoId.value;
};

const updateCurrentLyric = () => {
  if (!player || !player.getCurrentTime) return;

  const currentTime = player.getCurrentTime();
  const newIndex = parsedLyrics.value.findIndex((line, index, arr) => {
    return (
      currentTime >= line.time &&
      (index === arr.length - 1 || currentTime < arr[index + 1].time)
    );
  });

  if (newIndex !== -1 && newIndex !== currentLyricIndex.value) {
    currentLyricIndex.value = newIndex;
  }
};

const switchToPractice = (video_info) => {
  currentDiv.value = "practice";
  lyrics.value = video_info.lyrics;
};

watch(currentDiv, async (newValue) => {
  if (newValue === "practice" && prevVideoId.value !== videoId.value) {
    await initializePlayer();
  }

  if (newValue === "overview") {
    player.destroy();
  }
});

onMounted(async () => {
  axios.get("/get_video").then((data) => {
    allVideos.value = data;
  });
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

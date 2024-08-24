<template>
  <div class="flex flex-col px-10 py-4 gap-4">
    <div class="text-3xl flex items-center">
      <img src="/images/music-solid.svg" alt="回到音樂總覽" class="w-8 h-8 cursor-pointer m-4" @click="navigateToOverview" />
      {{ currentVideo ? currentVideo.video_name : "Loading..." }}
    </div>
    <div id="player-container" ref="playerContainerRef">
      <div id="player" ref="playerRef" :class="{ floating: isFloating }"></div>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row items-center gap-10 my-4">
        <!-- <el-radio-group v-model="display_mode" size="large">
          <el-radio value="ori" size="large">原文</el-radio>
          <el-radio value="cvt" size="large">轉換文本</el-radio>
          <el-radio value="both" size="large">雙語對照</el-radio>
        </el-radio-group> -->

        <div class="flex items-center gap-4">
          <el-input v-model="playbackRate" class="w-full max-w-[150px]">
            <template #prepend>
              <el-button size="small" @click="changePlaybackRate((playbackRate -= 0.25))">-</el-button>
            </template>
            <template #append>
              <el-button size="small" @click="changePlaybackRate((playbackRate += 0.25))">+</el-button>
            </template>
          </el-input>

          <el-checkbox v-model="autoScroll">自動滾動</el-checkbox>
        </div>
      </div>

      <div v-for="(line, index) in lyrics" :key="index" :id="`lyric-${index}`"
        :class="{ 'bg-yellow-200': currentLyricIndex === index }" class="flex items-center gap-4">
        <div class="flex items-center">
          <el-button type="text" plain @click="startVideo(line.timestamp)">
            <el-icon :size="25">
              <VideoPlay />
            </el-icon>
          </el-button>
          <el-button type="text" plain @click="pauseVideo">
            <el-icon :size="25">
              <VideoPause />
            </el-icon>
          </el-button>
        </div>
        <div class="flex gap-2 cursor-pointer" @click="jumpToTime(line.timestamp)">
          <!-- <div class="flex items-center">
            {{ line.timestamp }}
          </div> -->
          <template v-for="(ly, index) in line.lyrics">
            <div class="flex flex-col items-center justify-center">
              <div class="text-sm h-3 ">{{ ly.cvt }}</div>
              <div class="text-xl">{{ ly.ori }}</div>
            </div>
          </template>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import { VideoPlay, VideoPause } from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import axios from "@/utils/axios";

const router = useRouter();

const videoId = ref(router.currentRoute.value.params.id);
const currentVideo = ref(null);

const playerRef = ref(null);
let player = null;
const currentLyricIndex = ref(-1);
const lyrics = ref([]);

const display_mode = ref("both");
const playbackRate = ref(1);
const playerContainerRef = ref(null);
const isFloating = ref(false);

const autoScroll = ref(true);

const fetchVideo = async () => {
  try {
    const response = await axios.get("/get_video/" + videoId.value);
    if (response.length > 0) {
      currentVideo.value = response[0];
      lyrics.value = JSON.parse(currentVideo.value.converted_lyrics);
    }
  } catch (error) {
    console.error("Error fetching video:", error);
  }
};

const jumpToTime = (time1) => {
  console.log("Jump to time:", time1);
  if (player) {
    player.seekTo(parseTimeToSeconds(time1));
  }
};

const startVideo = (time2) => {
  console.log("Start video at time:", time2);
  if (player) {
    player.seekTo(parseTimeToSeconds(time2));
    player.playVideo();
  }
};

const pauseVideo = () => {
  if (player) {
    player.pauseVideo();
  }
};

const parseTimeToSeconds = (timeString) => {
  // convert '[00:14.74]'  to seconds
  const timeStringmatch = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (timeStringmatch) {
    const minutes = parseInt(timeStringmatch[1]);
    const seconds = parseFloat(timeStringmatch[2]);
    return minutes * 60 + seconds;
  }
  return 0;
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

const changePlaybackRate = (value) => {
  if (player && player.setPlaybackRate) {
    player.setPlaybackRate(value);
  }
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
        // 設置初始播放速度
        event.target.setPlaybackRate(playbackRate.value);
      },
    },
  });
};

const updateCurrentLyric = () => {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    for (let i = 0; i < lyrics.value.length; i++) {
      const nextTime = i < lyrics.value.length - 1
        ? parseTimeToSeconds(lyrics.value[i + 1].timestamp)
        : Infinity;

      if (currentTime >= parseTimeToSeconds(lyrics.value[i].timestamp) && currentTime < nextTime) {
        if (currentLyricIndex.value !== i) {
          currentLyricIndex.value = i;
          if (autoScroll.value) {
            scrollToCurrentLyric(i);
          }
        }
        break;
      }
    }
  }
};


const navigateToOverview = () => {
  router.push({ name: "songOverview" });
};

const scrollToCurrentLyric = (index) => {
  const lyricElement = document.getElementById(`lyric-${index}`);
  if (lyricElement) {
    lyricElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};

onMounted(async () => {
  await fetchVideo();
  await initializePlayer();
});

onUnmounted(() => {
  if (player) {
    player.destroy();
  }
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

#lyrics {
  font-family: "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell",
    "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif;
  font-size: 20px;
}

.ori {
  font-weight: bold;
}

.cvt {
  color: #666;
  margin-left: 10px;
}
</style>
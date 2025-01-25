<template>
  <div class="lg:h-[80vh] flex flex-col lg:overflow-hidden">
    <div class="h-full flex flex-col lg:flex-row px-4 md:px-10 py-4 gap-4">
      <!-- 影片播放器+功能列 -->
      <div class="flex flex-col lg:w-1/2">
        <div class="gradient-text-tech-animated">
          {{ currentVideo ? currentVideo.video_name : "Loading..." }}
        </div>
        <!-- 影片播放器 -->
        <div id="player-container" ref="playerContainerRef">
          <div
            id="player"
            ref="playerRef"
            :class="{ floating: isFloating }"
            style="max-height: 430px; aspect-ratio: 4/3"
          ></div>
        </div>

        <!-- 功能列 -->
        <div class="flex flex-col gap-2">
          <div class="w-full flex flex-col items-center gap-2 my-4 ">
            <div class="w-full flex flex-row items-center gap-4 justify-between">
              <div
                class="cursor-pointer hover:text-blue-500"
                @click="Go_to_previous_lyric()"
              >
                <el-tag>A</el-tag> 跳上一行
              </div>
              <div
                class="cursor-pointer hover:text-blue-500"
                @click="Go_to_next_lyric()"
              >
                <el-tag>D</el-tag> 跳下一行
              </div>
              <div
                class="cursor-pointer hover:text-blue-500"
                @click="toggleLoopCurrentLyric()"
              >
                <el-tag>S</el-tag>
                <span v-if="isLooping" class="text-red-600">取消循環</span>
                <span v-else>循環播放</span>
              </div>
            </div>

            <div class="w-full flex items-center gap-2 justify-between">
              <el-checkbox v-model="autoScroll">滾動</el-checkbox>

              <el-radio-group
                v-model="display_mode"
                size="large"
              >
                <el-radio value="hira" size="large" style="margin-right: 18px"
                  >一般</el-radio
                >
                <el-radio value="both" size="large">假名</el-radio>
              </el-radio-group>
              <el-input v-model="playbackRate" class="w-full max-w-[150px]">
                <template #prepend>
                  <el-button
                    size="small"
                    @click="changePlaybackRate((playbackRate -= 0.1))"
                    >-</el-button
                  >
                </template>
                <template #append>
                  <el-button
                    size="small"
                    @click="changePlaybackRate((playbackRate += 0.1))"
                    >+</el-button
                  >
                </template>
              </el-input>
            </div>
          </div>
        </div>
      </div>

      <!-- 歌詞 -->
      <el-scrollbar class="lyrics-container overflow-x-auto h-full lg:w-1/2">
        <div class="">
          <div
            v-for="(line, index) in lyrics"
            :key="index"
            :id="`lyric-${index}`"
            :class="{ 'bg-yellow-200': currentLyricIndex === index }"
            class="flex items-center gap-4 py-2"
          >
            <div class="flex-shrink-0 flex items-center">
              <el-button
                type="text"
                plain
                @click="handleStartVideoClick(line.timestamp)"
              >
                <el-icon :size="25">
                  <Switch />
                </el-icon>
              </el-button>

              <el-button
                type="text"
                plain
                @click="togglePlayPause"
                style="margin-left: 4px"
              >
                <el-icon :size="25">
                  <VideoPause v-if="isPlaying" />
                  <VideoPlay v-else />
                </el-icon>
              </el-button>
            </div>
            <div class="flex flex-wrap gap-2">
              <template v-for="(ly, lyIndex) in line.lyrics" :key="lyIndex">
                <div class="flex flex-col items-center justify-center">
                  <div class="text-sm h-3">
                    {{ display_mode === "both" ? ly.cvt : "" }}
                  </div>
                  <div class="text-xl">
                    {{ ly.ori }}
                  </div>
                </div>
              </template>
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from "vue";
import {
  VideoPause,
  VideoPlay,
  DArrowRight,
  Switch,
} from "@element-plus/icons-vue";
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
const isPlaying = ref(false);

const isLooping = ref(false);
const loopStart = ref(0);
const loopEnd = ref(0);

const fetchVideo = async () => {
  try {
    const response = await axios.get("/get_video/" + videoId.value);
    currentVideo.value = response;
    lyrics.value = JSON.parse(currentVideo.value.converted_lyrics);
  } catch (error) {
    console.error("Error fetching video:", error);
  }
};

const handleStartVideoClick = (time) => {
  // 使用者點擊跳轉歌詞時，取消循環
  if (isLooping.value) {
    toggleLoopCurrentLyric();
  }

  startVideo(time);
};

const startVideo = (time2) => {
  if (player) {
    player.seekTo(parseTimeToSeconds(time2));
    player.playVideo();
  }
};

const parseTimeToSeconds = (timeString) => {
  // convert '[mm:ss.ms]'  to seconds
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

const togglePlayPause = () => {
  if (player) {
    if (isPlaying.value) {
      player.pauseVideo();
      isPlaying.value = false;
    } else {
      player.playVideo();
      isPlaying.value = true;
    }
  }
};
const initializePlayer = async () => {
  await loadYouTubeAPI();
  player = new YT.Player(playerRef.value, {
    videoId: videoId.value,
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      playsinline: 1,
    },
    events: {
      onReady: (event) => {
        setInterval(updateCurrentLyric, 100); // Check every 100ms
        // 設置初始播放速度
        event.target.setPlaybackRate(playbackRate.value);
      },
      // Add onStateChange event to update isPlaying
      // 結束後從頭播放
      onStateChange: (event) => {
        isPlaying.value = event.data === YT.PlayerState.PLAYING;

        if (event.data === YT.PlayerState.ENDED) {
          event.target.seekTo(0);
          event.target.playVideo();
        }
      },
    },
  });
};

const updateCurrentLyric = () => {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();

    // Handle looping
    if (isLooping.value && currentTime >= loopEnd.value) {
      player.seekTo(loopStart.value);
      return;
    }

    for (let i = 0; i < lyrics.value.length; i++) {
      const nextTime =
        i < lyrics.value.length - 1
          ? parseTimeToSeconds(lyrics.value[i + 1].timestamp)
          : Infinity;

      if (
        currentTime >= parseTimeToSeconds(lyrics.value[i].timestamp) &&
        currentTime < nextTime
      ) {
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

const scrollToCurrentLyric = (index) => {
  const lyricElement = document.getElementById(`lyric-${index}`);
  if (lyricElement) {
    lyricElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};

const handleKeyPress = (event) => {
  switch (event.key.toLowerCase()) {
    case "a":
      Go_to_previous_lyric();
      break;
    case "d":
      Go_to_next_lyric();
      break;
    case "s":
      toggleLoopCurrentLyric();
      break;
  }
};

const Go_to_previous_lyric = () => {
  if (currentLyricIndex.value > 0) {
    startVideo(lyrics.value[currentLyricIndex.value - 1].timestamp);
  }
};

const Go_to_next_lyric = () => {
  if (currentLyricIndex.value < lyrics.value.length - 1) {
    startVideo(lyrics.value[currentLyricIndex.value + 1].timestamp);
  }
};

const toggleLoopCurrentLyric = () => {
  if (isLooping.value) {
    // Disable looping
    isLooping.value = false;
    loopStart.value = 0;
    loopEnd.value = 0;
  } else {
    // Enable looping for current lyric
    isLooping.value = true;
    loopStart.value = parseTimeToSeconds(
      lyrics.value[currentLyricIndex.value].timestamp
    );
    loopEnd.value =
      currentLyricIndex.value < lyrics.value.length - 1
        ? parseTimeToSeconds(
            lyrics.value[currentLyricIndex.value + 1].timestamp
          )
        : player.getDuration();
  }
};

onMounted(async () => {
  await fetchVideo();
  await initializePlayer();
  window.addEventListener("keypress", handleKeyPress);
});

onUnmounted(() => {
  if (player) {
    player.destroy();
  }
  window.removeEventListener("keypress", handleKeyPress);
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

.lyrics-container {
  max-width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .lyrics-container > div {
    min-width: 100%;
  }
}

.fixed-play-button {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 1000;
}

.gradient-text-tech-animated {
  background: linear-gradient(120deg, #4caf50, #2196f3, #673ab7, #4caf50);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: bold;
  font-size: 1.5rem;
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

::v-deep .el-radio__input.is-checked .el-radio__inner {
  border-color: #67C23A; /* 更改边框颜色 */
  background-color: #67C23A; /* 更改背景颜色 */
}

::v-deep .el-radio__input.is-checked + .el-radio__label {
  color: #67C23A; /* 更改文字颜色 */
}
</style>
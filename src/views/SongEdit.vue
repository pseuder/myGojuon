<template>
  <div class="lg:h-[80vh] flex flex-col lg:overflow-hidden">
    <div class="h-full flex flex-col lg:flex-row px-4 md:px-10 py-4 gap-4">
      <!-- 影片播放器+功能列 -->
      <div class="flex flex-col lg:w-1/2 gap-4">
        <div class="flex">
          <el-input v-model="videoId" class="w-full" placeholder="輸入YT ID" />
          <el-button type="success " plain @click="handleReloadYT">
            載入影片
          </el-button>
        </div>
        <!-- 影片播放器 -->
        <div id="player-container" ref="playerContainerRef" class="h-[70%]">
          <div
            id="player"
            ref="playerRef"
            :class="{ floating: isFloating }"
            style="max-height: 430px; aspect-ratio: 4/3"
          ></div>
        </div>

        <!-- 功能列 -->
        <div class="h-[10%] flex flex-col gap-2">
          <div class="w-full flex flex-col items-center gap-2 my-4">
            <!-- 第一列 -->
            <div
              class="w-full flex flex-row items-center gap-4 justify-between"
            >
              <el-button class="w-full" type="warning " plain @click="handleCopy">
                複製結果到剪貼簿
              </el-button>
            </div>

            <!-- 第二列 -->
            <div class="w-full flex items-center gap-2 justify-between">
              <el-button class="w-full" type="primary" plain @click="handleInsert">
                插入中斷
              </el-button>
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
              <el-button type="text" plain @click="startVideo(line.timestamp)">
                <el-icon :size="25">
                  <Switch />
                </el-icon>
              </el-button>

              <el-button type="text" plain @click="handleDelete(index)">
                <el-icon :size="25" color="red">
                  <Delete />
                </el-icon>
              </el-button>
              <el-input v-model="line.timestamp" class="w-24" placeholder="輸入時間" />
            </div>
            <div class="w-full flex flex-wrap gap-2">
              <el-input v-model="line.lyric" class="w-full" placeholder="" />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { Delete, Switch } from "@element-plus/icons-vue";

const videoId = ref("");
const playerRef = ref(null);
let player = null;
const isPlaying = ref(false);
const lyrics = ref([]);
const isFloating = ref(false);


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

const startVideo = (time2) => {
  if (player) {
    player.seekTo(parseTimeToSeconds(time2));
    player.playVideo();
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

const handleInsert = () => {
  if (window.player) {
    const currentTime = window.player.getCurrentTime();
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100);
    const formattedTime = `[${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}]`;
    lyrics.value.push({ timestamp: formattedTime, lyric: "" });

    nextTick(() => {
      scrollToCurrentLyric(lyrics.value.length - 1);
    });
  } else {
    console.error("YouTube player is not ready yet.");
  }
};

const handleDelete = (index) => {
  lyrics.value.splice(index, 1);
};

const handleCopy = () => {
  const result = lyrics.value
    .map((line) => `${line.timestamp}${line.lyric}`)
    .join("\n");
  navigator.clipboard.writeText(result);
};

const handleKeyPress = (event) => {
  switch (event.key.toLowerCase()) {
    case "enter":
      handleInsert();
      break;
    case "a":
      handleYTBack(5);
      break;
    case "d":
      handleYTForward(5);
      break;
  }
};

const handleReloadYT = () => {
  if (player) {
    player.loadVideoById(videoId.value);
  }
};

const handleYTBack = (seconds) => {
  if (player) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime - seconds, true);
  }
};

const handleYTForward = (seconds) => {
  if (player) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + seconds, true);
  }
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
    height: "100%",
    width: "100%",
    playerVars: {
      autoplay: 0,
      playsinline: 1,
    },
    events: {
      onReady: (event) => {
        window.player = event.target;
      },
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

onMounted(async () => {
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
.lyrics-container {
  max-width: 100%;
  overflow-x: auto;
}

@media (max-width: 768px) {
  .lyrics-container > div {
    min-width: 100%;
  }
}
</style>
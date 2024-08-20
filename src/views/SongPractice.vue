<template>
  <div class="flex flex-col px-10 py-4 gap-4">
    <div class="text-3xl flex items-center">
      <img
        src="/images/music-solid.svg"
        alt="回到音樂總覽"
        class="w-8 h-8 cursor-pointer m-4"
        @click="navigateToOverview"
      />
      {{ currentVideo ? currentVideo.video_name : "Loading..." }}
    </div>
    <div id="player-container" ref="playerContainerRef">
      <div id="player" ref="playerRef" :class="{ floating: isFloating }"></div>
    </div>
    <div class="flex flex-col gap-4">
      <div class="flex flex-col md:flex-row items-center gap-10 my-4">
        <el-radio-group
          v-model="lyrics_mode"
          @change="lyrics_mode_change"
          size="large"
        >
          <el-radio value="origin" size="large">原文</el-radio>
          <el-radio value="hiragana" size="large">平假名</el-radio>
          <el-radio value="romaji" size="large">羅馬拼音</el-radio>
        </el-radio-group>

        <div class="flex items-center gap-4">
          <el-input v-model="playbackRate" class="w-full max-w-[150px]">
            <template #prepend>
              <el-button
                size="small"
                @click="changePlaybackRate((playbackRate -= 0.25))"
                >-</el-button
              >
            </template>
            <template #append
              ><el-button
                size="small"
                @click="changePlaybackRate((playbackRate += 0.25))"
                >+</el-button
              ></template
            >
          </el-input>

          <el-checkbox v-model="autoScroll">自動滾動</el-checkbox>
        </div>
      </div>

      <div
        v-for="(line, index) in parsedLyrics"
        :key="index"
        :id="`lyric-${index}`"
        :class="{ 'bg-yellow-200': currentLyricIndex === index }"
        class="flex items-center gap-4"
      >
        <div class="flex items-center">
          <el-button type="text" plain @click="startVideo(line.time)">
            <el-icon :size="25"><VideoPlay /></el-icon>
          </el-button>
          <el-button type="text" plain @click="pauseVideo">
            <el-icon :size="25"><VideoPause /></el-icon>
          </el-button>
        </div>
        <span
          class="cursor-pointer hover:underline"
          @click="jumpToTime(line.time)"
          >{{ line.text }}</span
        >
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

const lyrics_mode = ref("origin");
const playbackRate = ref(1);
const playerContainerRef = ref(null);
const isFloating = ref(false);

const autoScroll = ref(true);

const fetchVideo = async () => {
  const data = await axios.get("/get_video/" + videoId.value);
  if (data.length > 0) {
    currentVideo.value = data[0];
    lyrics.value = currentVideo.value.lyrics;
  }
};

const lyrics_mode_change = (value) => {
  lyrics_mode.value = value;
  switch (value) {
    case "origin":
      lyrics.value = currentVideo.value.lyrics;
      break;
    case "hiragana":
      lyrics.value = currentVideo.value.hiragana_lyrics;
      break;
    case "romaji":
      lyrics.value = currentVideo.value.romaji_lyrics;
      break;
  }
};

const jumpToTime = (time) => {
  if (player) {
    player.seekTo(time);
  }
};

const startVideo = (time) => {
  if (player) {
    jumpToTime(time);
    player.playVideo();
  }
};

const pauseVideo = () => {
  if (player) {
    player.pauseVideo();
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
    if (autoScroll.value) scrollToCurrentLyric(newIndex);
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
</style>

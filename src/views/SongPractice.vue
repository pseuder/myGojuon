<template>
  <div>
    <div class="text-3xl">
      <label for="videoId">YouTube Video ID:</label>
      <input id="videoId" v-model="videoId" @input="loadVideo" />
    </div>
    <div id="player" ref="playerRef"></div>
    <div class="lyrics">
      <span class="text-3xl">歌詞</span>
      <div
        v-for="(line, index) in parsedLyrics"
        :key="index"
        class="lyric-line"
      >
        <el-button type="primary" @click="jumpToTime(line.time)" plain>
          {{ formatTime(line.time) }}
        </el-button>
        <span>{{ line.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from "vue";

const videoId = ref("SDk1RA4g8CA");
const timeInput = ref(0);
const playerRef = ref(null);
let player = null;

const lyrics = ref("");
const parsedLyrics = computed(() => {
  return lyrics.value
    .split("\n")
    .filter((line) => {
      // 過濾掉不需要顯示的標記行
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

const loadVideo = () => {
  if (player && videoId.value) {
    player.loadVideoById(videoId.value);
  }
};

const setVideoTime = () => {
  if (player) {
    player.seekTo(timeInput.value);
  }
};

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

onMounted(async () => {
  // Load lyrics
  try {
    const response = await fetch("/src/data/BTR.lrc");
    lyrics.value = await response.text();
  } catch (error) {
    console.error("Failed to load lyrics:", error);
  }

  // Load YouTube IFrame API
  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  const firstScriptTag = document.getElementsByTagName("script")[0];
  firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);

  window.onYouTubeIframeAPIReady = () => {
    player = new YT.Player(playerRef.value, {
      height: "360",
      width: "640",
      videoId: videoId.value,
      events: {
        onReady: (event) => {
          console.log("Player is ready");
        },
      },
    });
  };
});
</script>

<style scoped>
.lyrics {
  margin-top: 20px;
}
.lyric-line {
  margin-bottom: 5px;
}
button {
  margin-right: 10px;
}
</style>

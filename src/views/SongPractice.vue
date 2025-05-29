<template>
  <div class="lg:h-[80vh] flex flex-col lg:overflow-hidden">
    <div class="h-full flex flex-col lg:flex-row px-4 md:px-10 py-4 gap-4">
      <!-- 影片播放器+功能列 -->
      <div class="flex flex-col lg:w-1/2">
        <div class="gradient-text-tech-animated">
          {{ currentVideo ? currentVideo.video_name : "Loading..." }}
          -
          {{ currentVideo ? currentVideo.author : "Loading..." }}
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
            <div
              class="w-full flex flex-row items-center gap-4 justify-between"
            >
              <div
                class="cursor-pointer hover:text-blue-500"
                @click="Go_to_previous_lyric()"
              >
                <el-tag>A</el-tag> {{ t("jump_previous_line") }}
              </div>
              <div
                class="cursor-pointer hover:text-blue-500"
                @click="Go_to_next_lyric()"
              >
                <el-tag>D</el-tag> {{ t("jump_next_line") }}
              </div>
              <div
                class="cursor-pointer hover:text-blue-500"
                @click="toggleLoopCurrentLyric()"
              >
                <el-tag>S</el-tag>
                <span v-if="isLooping" class="text-red-600">{{
                  t("stop_looping")
                }}</span>
                <span v-else>{{ t("loop_playback") }}</span>
              </div>
            </div>

            <div class="w-full flex items-center gap-2 justify-between">
              <el-checkbox v-model="autoScroll">{{
                t("scrolling")
              }}</el-checkbox>

              <el-radio-group v-model="display_mode" size="large">
                <el-radio
                  value="hira"
                  size="large"
                  style="margin-right: 18px"
                  >{{ t("normal") }}</el-radio
                >
                <el-radio value="both" size="large">{{ t("mixed") }}</el-radio>
              </el-radio-group>
              <el-input-number
                v-model="playbackRate"
                :precision="1"
                :step="0.1"
                :max="2"
                :min="0.3"
                @change="changePlaybackRate(playbackRate)"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 歌詞 -->
      <el-scrollbar class="lyrics-container overflow-x-auto h-full lg:w-1/2">
        <el-button type="warning" size="small" @click="handleCopyLyrics" plain>
          複製歌詞
        </el-button>
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
  Switch,
} from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { useRouter, useRoute } from "vue-router";
import axios from "@/utils/axios";
import { useI18n } from "vue-i18n";
const { t, locale } = useI18n();

const router = useRouter();
const route = useRoute();

const videoId = ref(route.params.id);
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

// --- New state for all videos and filtered videos ---
const allVideos = ref([]);

const fetchAllVideos = async () => {
  try {
    const response = await axios.get("/get_all_videos");
    allVideos.value = response.videos;
  } catch (error) {
    console.error("Error fetching all videos:", error);
    ElMessage.error("無法獲取所有歌曲列表");
    allVideos.value = []; 
  }
};

const authorFilteredVideos = computed(() => {
  if (!currentVideo.value || !currentVideo.value.author || !allVideos.value.length) {
    return [];
  }
  // Filter by author and sort by UID to ensure "next" is correctly identified
  const filtered = allVideos.value
    .filter(video => video.author === currentVideo.value.author)
    .sort((a, b) => a.uid - b.uid);
  return filtered;
});

const currentVideoIndexInAuthorList = computed(() => {
  if (!currentVideo.value || !authorFilteredVideos.value.length) {
    return -1;
  }
  // Find the index of the current video (using its videoId) in the filtered list
  const index = authorFilteredVideos.value.findIndex(
    (v) => v.video_id === currentVideo.value.videoId
  );
  return index;
});
// --- End of new state ---

const fetchVideo = async () => {
  try {
    // videoId.value is the YouTube video ID
    const response = await axios.get("/get_video/" + videoId.value);
    currentVideo.value = response;
    if (!currentVideo.value.videoId) {
        currentVideo.value.videoId = videoId.value;
    }
    lyrics.value = JSON.parse(currentVideo.value.converted_lyrics || "[]");
    updateMetaTags();
  } catch (error) {
    console.error("Error fetching video:", error);
    ElMessage.error("無法獲取歌曲資訊");
  }
};

const updateMetaTags = () => {
  if (!currentVideo.value) return;
  const video = currentVideo.value;
  document.title = `${video.video_name} - ${video.author} | 日語歌曲練習`;
  updateMetaTag('description', `練習日語歌曲《${video.video_name}》by ${video.author}。提供歌詞對照、發音練習、循環播放等功能，幫助您學習日語。`);
  updateMetaTag('keywords', `日語歌曲, ${video.video_name}, ${video.author}, 日語學習, 歌詞練習, 發音練習, 五十音`);
  updateMetaTag('og:title', `${video.video_name} - ${video.author} | 日語歌曲練習`);
  updateMetaTag('og:description', `練習日語歌曲《${video.video_name}》by ${video.author}。提供歌詞對照、發音練習、循環播放等功能。`);
  updateMetaTag('og:type', 'website');
  updateMetaTag('og:url', window.location.href);
  updateMetaTag('twitter:card', 'summary');
  updateMetaTag('twitter:title', `${video.video_name} - ${video.author} | 日語歌曲練習`);
  updateMetaTag('twitter:description', `練習日語歌曲《${video.video_name}》by ${video.author}。提供歌詞對照、發音練習、循環播放等功能。`);
  updateStructuredData(video);
};

const updateMetaTag = (name, content) => {
  const isProperty = name.startsWith('og:') || name.startsWith('twitter:');
  const attribute = isProperty ? 'property' : 'name';
  let meta = document.querySelector(`meta[${attribute}="${name}"]`);
  if (meta) {
    meta.setAttribute('content', content);
  } else {
    meta = document.createElement('meta');
    meta.setAttribute(attribute, name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
  }
};

const updateStructuredData = (video) => {
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) existingScript.remove();
  const structuredData = {
    "@context": "https://schema.org", "@type": "WebPage",
    "name": `${video.video_name} - ${video.author} | 日語歌曲練習`,
    "description": `練習日語歌曲《${video.video_name}》by ${video.author}。提供歌詞對照、發音練習、循環播放等功能。`,
    "url": window.location.href,
    "mainEntity": { "@type": "MusicRecording", "name": video.video_name, "byArtist": { "@type": "Person", "name": video.author }, "inLanguage": "ja" },
    "provider": { "@type": "Organization", "name": "日語五十音學習網站" }
  };
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(structuredData);
  document.head.appendChild(script);
};

const handleStartVideoClick = (time) => {
  if (isLooping.value) toggleLoopCurrentLyric();
  startVideo(time);
};

const startVideo = (time2) => {
  if (player && player.seekTo) {
    player.seekTo(parseTimeToSeconds(time2));
    player.playVideo();
  }
};

const parseTimeToSeconds = (timeString) => {
  const timeStringmatch = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (timeStringmatch) {
    return parseInt(timeStringmatch[1]) * 60 + parseFloat(timeStringmatch[2]);
  }
  return 0;
};

const loadYouTubeAPI = () => {
  return new Promise((resolve) => {
    if (window.YT && window.YT.Player) { // Check for Player as well
      resolve();
    } else {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = () => {
        resolve();
      };
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
    } else {
      player.playVideo();
    }
  }
};

// --- New function to play next song ---
const playNextSong = () => {
  if (currentVideoIndexInAuthorList.value === -1) {
    console.warn("Current video not found in author's list. Looping current.");
    if (player && player.seekTo) player.seekTo(0);
    if (player && player.playVideo) player.playVideo();
    return;
  }

  const nextIndex = currentVideoIndexInAuthorList.value + 1;
  if (nextIndex < authorFilteredVideos.value.length) {
    const nextSong = authorFilteredVideos.value[nextIndex];
    ElMessage.info(`即將播放下一首: ${nextSong.video_name}`);
    router.push({ name: "songPractice", params: { id: nextSong.video_id } });
  } else {
    ElMessage.info("已是此歌手的最後一首歌，將從頭播放目前歌曲。");
    if (player && player.seekTo) player.seekTo(0);
    if (player && player.playVideo) player.playVideo();
  }
};

const initializePlayer = async () => {
  if (!videoId.value) {
    console.error("No videoId to initialize player.");
    ElMessage.error("沒有有效的影片ID");
    return;
  }
  await loadYouTubeAPI();
  if (playerRef.value && typeof YT !== 'undefined' && YT.Player) {
    player = new YT.Player(playerRef.value, {
      videoId: videoId.value,
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 1,
        playsinline: 1,
      },
      events: {
        onReady: (event) => {
          setInterval(updateCurrentLyric, 100);
          event.target.setPlaybackRate(playbackRate.value);
        },
        onStateChange: (event) => {
          isPlaying.value = event.data === YT.PlayerState.PLAYING;
          if (event.data === YT.PlayerState.ENDED) {
            playNextSong();
          }
        },
        onError: (event) => {
            console.error("YouTube Player Error:", event.data);
            ElMessage.error(`播放器錯誤: ${event.data}`);
        }
      },
    });
  } else {
    console.error("Player ref not available or YouTube API not fully loaded for YT.Player.");
    ElMessage.error("播放器初始化失敗，請稍後再試");
  }
};

const updateCurrentLyric = () => {
  if (player && player.getCurrentTime && lyrics.value.length > 0) {
    const currentTime = player.getCurrentTime();

    if (isLooping.value && loopEnd.value > 0 && currentTime >= loopEnd.value) {
      player.seekTo(loopStart.value);
      return;
    }

    for (let i = 0; i < lyrics.value.length; i++) {
      const lineStartTime = parseTimeToSeconds(lyrics.value[i].timestamp);
      const nextLineStartTime =
        i < lyrics.value.length - 1
          ? parseTimeToSeconds(lyrics.value[i + 1].timestamp)
          : player.getDuration() || Infinity; // Use video duration if available

      if (currentTime >= lineStartTime && currentTime < nextLineStartTime) {
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
    lyricElement.scrollIntoView({ behavior: "smooth", block: "center" });
  }
};

const handleKeyPress = (event) => {
  console.log(event);
  if (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA') {
    return;
  }
  console.log(event.key.toLowerCase());
  switch (event.key.toLowerCase()) {
    case "a": Go_to_previous_lyric(); break;
    case "d": Go_to_next_lyric(); break;
    case "s": toggleLoopCurrentLyric(); break;
  }
};

const handleCopyLyrics = () => {
  let result = "";
  for (const line of lyrics.value) {
    let combinedLyric = "";
    for (const lyric of line.lyrics) combinedLyric += `${lyric.ori}`;
    result += `${line.timestamp}${combinedLyric}\n`;
  }
  navigator.clipboard.writeText(result);
  ElMessage.success("複製成功");
};

const Go_to_previous_lyric = () => {
  if (currentLyricIndex.value > 0 && lyrics.value.length > 0) {
    startVideo(lyrics.value[currentLyricIndex.value - 1].timestamp);
  }
};

const Go_to_next_lyric = () => {
  if (currentLyricIndex.value < lyrics.value.length - 1) {
    startVideo(lyrics.value[currentLyricIndex.value + 1].timestamp);
  }
};

const toggleLoopCurrentLyric = () => {
  if (lyrics.value.length === 0 || currentLyricIndex.value < 0) {
    ElMessage.warning("沒有可循環的歌詞行");
    return;
  }
  isLooping.value = !isLooping.value;
  if (isLooping.value) {
    loopStart.value = parseTimeToSeconds(lyrics.value[currentLyricIndex.value].timestamp);
    loopEnd.value =
      currentLyricIndex.value < lyrics.value.length - 1
        ? parseTimeToSeconds(lyrics.value[currentLyricIndex.value + 1].timestamp)
        : (player && player.getDuration ? player.getDuration() : Infinity);
    ElMessage.success("開始循環當前行");
  } else {
    loopStart.value = 0;
    loopEnd.value = 0;
    ElMessage.info("停止循環");
  }
};

watch(currentVideo, (newVideo) => {
  if (newVideo) updateMetaTags();
}, { deep: true });

// --- Watch for route parameter changes to load new video ---
watch(() => route.params.id, async (newId, oldId) => {
  if (newId && newId !== oldId) {
    videoId.value = newId;

    // Reset states for the new video
    currentLyricIndex.value = -1;
    lyrics.value = [];
    isLooping.value = false;

    if (player) {
      player.destroy();
      player = null;
    }
    
    await fetchVideo();
    await initializePlayer();
  }
}, { immediate: false });

const cleanupMetaTags = () => {
  document.title = '日語五十音學習網站';
  const metaSelectors = [
    'meta[name="description"]', 'meta[name="keywords"]',
    'meta[property^="og:"]', 'meta[property^="twitter:"]',
    'script[type="application/ld+json"]'
  ];
  metaSelectors.forEach(selector => {
    document.querySelectorAll(selector).forEach(el => el.remove());
  });
};

onMounted(async () => {
  await fetchAllVideos();
  await fetchVideo();
  await initializePlayer();
  window.addEventListener("keypress", handleKeyPress);
});

onUnmounted(() => {
  if (player) {
    player.destroy();
    player = null;
  }
  window.removeEventListener("keypress", handleKeyPress);
  cleanupMetaTags();
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
  border-color: #67c23a; /* 更改边框颜色 */
  background-color: #67c23a; /* 更改背景颜色 */
}

::v-deep .el-radio__input.is-checked + .el-radio__label {
  color: #67c23a; /* 更改文字颜色 */
}
</style>
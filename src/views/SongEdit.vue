<template>
  <div class="sm:h-[80vh] flex flex-col sm:overflow-hidden">
    <div class="h-full flex flex-col sm:flex-row px-4 sm:px-10 py-4 gap-2">
      <!-- 影片播放器+功能列 -->
      <div class="flex flex-col sm:w-1/2 gap-2">
        <!-- 載入影片 -->
        <div class="flex">
          <el-input v-model="videoId" class="w-full" placeholder="輸入YT ID" />
          <el-button type="success " plain @click="handleReloadYT">
            載入影片
          </el-button>
          <el-button type="primary" @click="openSearchDialog">
            搜尋影片
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

        <div class="flex">
          <el-input v-model="videoTitle" class="w-full" placeholder="輸入標題" />
          <el-input v-model="videoChannel" class="w-full" placeholder="輸入頻道名稱" />
        </div>

        <!-- 功能列 -->
        <div class="h-[10%] flex flex-col gap-2">
          <div class="w-full flex items-center gap-2">
            <!-- 第一列 -->
            <div
              class="w-full flex flex-row items-center gap-4 justify-between"
            >
              <el-button
                class="w-full"
                type="warning "
                plain
                @click="handleLyricsDialogOpen"
              >
                貼上原始歌詞
              </el-button>
            </div>

            <!-- 第二列 -->
            <div class="w-full flex items-center gap-2 justify-between">
              <el-button
                class="w-full"
                type="primary"
                plain
                @click="handleInsert"
              >
                插入中斷
              </el-button>
            </div>

            <!-- 第三列 -->
            <div
              class="w-full flex flex-row items-center gap-4 justify-between"
            >
              <el-button
                class="w-full"
                type="success "
                plain
                @click="handleCopy"
              >
                複製結果
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 歌詞 -->
      <el-scrollbar class="lyrics-container overflow-x-auto h-full sm:w-1/2">
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
              <el-input
                v-model="line.timestamp"
                class="w-24"
                placeholder="輸入時間"
              />
            </div>
            <div class="w-full flex flex-wrap gap-2">
              <el-input v-model="line.lyric" class="w-full" placeholder="" />
            </div>
          </div>
        </div>
      </el-scrollbar>
    </div>

    <!-- 歌詞貼上 Dialog -->
    <el-dialog title="貼上原始歌詞" v-model="lyricsDialogVisible">
      <el-input v-model="originalLyrics" type="textarea" rows="10" />
      <div class="flex justify-end gap-4 mt-4">
        <el-button @click="handleLyricsDialogClose">取消</el-button>
        <el-button type="primary" @click="handleLyricsDialogSubmit"
          >貼上</el-button
        >
      </div>
    </el-dialog>

    <!-- YouTube 搜尋 Dialog -->
    <el-dialog
      title="搜尋 YouTube 影片"
      v-model="searchDialogVisible"
      width="90%"
      top="5vh"
    >
      <div class="h-[75vh]">
        <div class="h-[7%] flex gap-2 mb-4">
          <el-input v-model="searchQuery" placeholder="輸入搜尋關鍵字" />
          <el-button type="primary" @click="searchYouTube">搜尋</el-button>
          <el-button v-if="nextPageToken" type="warning " @click="loadMoreResults"
            >載入更多</el-button
          >
        </div>

        <div class="h-[90%] overflow-y-auto">
          <el-list v-if="searchResults.length > 0">
            <template v-for="item in searchResults" :key="item.id.videoId">
              <el-list-item>
                <div class="flex items-center gap-4">
                  <el-image
                    :src="item.snippet.thumbnails.high.url"
                    :alt="item.snippet.title"
                    style="width: 40%; height: auto; object-fit: cover"
                    class="flex-shrink-0"
                  />
                  <div class="flex flex-col gap-2" style="width: 60%">
                    <p class="font-medium">{{ item.snippet.title }}</p>
                    <p class="text-gray-500">{{ item.snippet.channelTitle }}</p>
                    <el-button
                      class="w-full"
                      type="success"
                      size="small"
                      @click="selectVideo(item)"
                    >
                      選擇
                    </el-button>
                  </div>
                </div>
              </el-list-item>
              <el-divider />
            </template>
          </el-list>
          <div v-else-if="loading">載入中...</div>
          <div v-else>找不到相關影片</div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick } from "vue";
import { Delete, Switch } from "@element-plus/icons-vue";
import axios from "axios"; // 引入 Axios
import myAxios from "@/utils/axios";

const videoId = ref("");
const videoTitle = ref("");
const videoChannel = ref("");

const playerRef = ref(null);
let player = null;
const isPlaying = ref(false);
const lyrics = ref([]);
const isFloating = ref(false);
const currentLyricIndex = ref(-1);

// 歌詞貼上 Dialog
const lyricsDialogVisible = ref(false);
const originalLyrics = ref("");

// YouTube 搜尋 Dialog
const searchDialogVisible = ref(false);
const searchQuery = ref("");
const searchResults = ref([]);
const loading = ref(false);
const nextPageToken = ref(false);

// 你的 YouTube API 金鑰
const apiKey = ref("AIzaSyANQdZOuIqWyfjlBusOE95tN1Mqyjy1Mvw");

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

// 歌詞Dialog相關
const handleLyricsDialogOpen = () => {
  lyricsDialogVisible.value = true;
};

const handleLyricsDialogClose = () => {
  lyricsDialogVisible.value = false;
};

const handleLyricsDialogSubmit = () => {
  lyrics.value = originalLyrics.value
    .split("\n")
    .map((line) => {
      const timeString = line.match(/\[(\d+:\d+\.\d+)\]/);
      if (timeString) {
        return {
          timestamp: timeString[1],
          lyric: line.replace(timeString[0], ""),
        };
      }
      return { timestamp: "", lyric: line };
    })
    .filter((line) => line.lyric.trim() !== "");
  lyricsDialogVisible.value = false;
};

// 插入歌詞相關
const handleInsert = () => {
  if (window.player) {
    const currentTime = window.player.getCurrentTime();
    const minutes = Math.floor(currentTime / 60);
    const seconds = Math.floor(currentTime % 60);
    const milliseconds = Math.floor((currentTime % 1) * 100);
    const formattedTime = `[${String(minutes).padStart(2, "0")}:${String(
      seconds
    ).padStart(2, "0")}.${String(milliseconds).padStart(2, "0")}]`;

    // 尋找最前面的空位
    const emptyIndex = lyrics.value.findIndex((line) => line.timestamp === "");
    if (emptyIndex !== -1) {
      lyrics.value[emptyIndex].timestamp = formattedTime;
    } else {
      lyrics.value.push({ timestamp: formattedTime, lyric: "" });
    }

    nextTick(() => {
      scrollToCurrentLyric(
        emptyIndex !== -1 ? emptyIndex : lyrics.value.length - 1
      );
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

const handleFindLyrics = async () => {
  try {
    const response = await myAxios.get("/gemini_get_lyrics", {
      params: {
        title: videoTitle.value,
        channel: videoChannel.value,
      },
    });

    console.log("取得歌詞：", response.data);
    let res_lyrics = response.data;

    if (res_lyrics === "") {
      ElMessage.warning("找不到歌詞");
      return;
    }

    lyrics.value = res_lyrics
      .split("\n")
      .map((line) => {
        const timeString = line.match(/\[(\d+:\d+\.\d+)\]/);
        if (timeString) {
          return {
            timestamp: timeString[1],
            lyric: line.replace(timeString[0], ""),
          };
        }
        return { timestamp: "", lyric: line };
      })
      .filter((line) => line.lyric.trim() !== "");
      

  } catch (error) {
    console.error("取得歌詞時發生錯誤：", error);
    ElMessage.error("取得歌詞時發生錯誤");
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

const updateCurrentLyric = () => {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
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
        }
        break;
      }
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

// YouTube 搜尋 Dialog 相關
const openSearchDialog = () => {
  searchDialogVisible.value = true;
};

const closeSearchDialog = () => {
  searchDialogVisible.value = false;
};

const searchYouTube = async () => {
  loading.value = true;
  searchResults.value = []; // 清空之前的搜尋結果
  nextPageToken.value = ""; // 重置分頁 token
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: 10,
          q: searchQuery.value,
          type: "video",
          key: apiKey.value,
        },
      }
    );
    searchResults.value = response.data.items;
    nextPageToken.value = response.data.nextPageToken || "";
  } catch (error) {
    console.error("搜尋 YouTube 影片時發生錯誤：", error);
    ElMessage.error("搜尋 YouTube 影片時發生錯誤");
  } finally {
    loading.value = false;
  }
};

const selectVideo = (videoItemFromSearch) => {
  videoId.value = videoItemFromSearch.id.videoId;
  videoTitle.value = videoItemFromSearch.snippet.title;
  videoChannel.value = videoItemFromSearch.snippet.channelTitle;
  handleReloadYT(); 
  handleFindLyrics();
  closeSearchDialog();
};

const loadMoreResults = async () => {
  if (!nextPageToken.value) return;

  loading.value = true;
  try {
    const response = await axios.get(
      "https://www.googleapis.com/youtube/v3/search",
      {
        params: {
          part: "snippet",
          maxResults: 10,
          q: searchQuery.value,
          type: "video",
          key: apiKey.value,
          pageToken: nextPageToken.value,
        },
      }
    );
    searchResults.value = [...searchResults.value, ...response.data.items];
    nextPageToken.value = response.data.nextPageToken || "";
  } catch (error) {
    console.error("載入更多 YouTube 影片時發生錯誤：", error);
    ElMessage.error("載入更多 YouTube 影片時發生錯誤");
  } finally {
    loading.value = false;
  }
};
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

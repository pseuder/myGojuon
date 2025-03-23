<template>
  <div class="sm:h-[80vh] flex flex-col sm:overflow-hidden">
    <div class="h-full flex flex-col sm:flex-row px-4 sm:px-10 py-4 gap-2">
      <!-- 影片播放器+功能列 -->
      <div class="flex flex-col sm:w-1/3 gap-2">
        <!-- 載入影片 -->
        <div class="flex">
          <el-input
            v-model="videoId"
            class="w-full"
            placeholder="輸入YT ID"
            @click="handleCopyToClipboard(videoId)"
          />
          <el-button type="success " plain @click="handleReloadYT">
            載入影片
          </el-button>
          <el-button type="primary" @click="openSearchDialog">
            搜尋影片
          </el-button>
        </div>
        <!-- 影片播放器 -->
        <div id="player-container" ref="playerContainerRef" class="h-fit">
          <div
            id="player"
            ref="playerRef"
            style="max-height: 430px; aspect-ratio: 4/3"
          ></div>
        </div>

        <div class="flex">
          <el-button type="danger" @click="handleClearLyrics"
            >清空歌詞</el-button
          >
          <el-input
            v-model="timeDiff"
            class="w-full"
            placeholder="輸入時間差"
          ></el-input>
          <el-button type="danger" @click="handleBulkTimeDiff('minus')"
            >批量減時間</el-button
          >
          <el-button type="danger" @click="handleBulkTimeDiff('add')"
            >批量增時間</el-button
          >
        </div>

        <div class="flex">
          <el-input
            v-model="videoTitle"
            class="w-full"
            placeholder="輸入標題"
            @click="handleCopyToClipboard(videoTitle)"
          />
          <el-input
            v-model="videoChannel"
            class="w-full"
            placeholder="輸入頻道名稱"
            @click="handleCopyToClipboard(videoChannel)"
          />
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
            <!-- <div class="w-full flex items-center gap-2 justify-between">
              <el-button
                class="w-full"
                type="primary"
                plain
                @click="handleInsert"
              >
                插入中斷
              </el-button>
            </div> -->

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
                複製原版結果
              </el-button>
            </div>

            <div
              class="w-full flex flex-row items-center gap-4 justify-between"
            >
              <el-button
                class="w-full"
                type="success "
                plain
                @click="handleCopyHiragana"
              >
                複製平假結果
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- 歌詞 -->
      <el-scrollbar
        class="lyrics-container overflow-x-auto h-full sm:w-2/3"
        v-loading="lyricsLoading"
      >
        <div class="">
          <div
            v-for="(line, index) in allLyrics"
            :key="index"
            :id="`lyric-${index}`"
            :class="{ 'bg-yellow-100': currentLyricIndex === index }"
            class="flex items-center gap-4 py-4"
            style="border-block-width: 6px; border-block-color: #e5e7eb"
          >
            <div class="flex-shrink-0 flex flex-col items-center">
              <div class="flex">
                <el-button
                  type="text"
                  plain
                  @click="startVideoOn(line.timestamp)"
                >
                  <el-icon :size="25">
                    <Switch />
                  </el-icon>
                </el-button>

                <el-button type="text" plain @click="handleDelete(index)">
                  <el-icon :size="25" color="red">
                    <Delete />
                  </el-icon>
                </el-button>
              </div>

              <el-input
                v-model="line.timestamp"
                class="w-24"
                placeholder="輸入時間"
              />
            </div>
            <div class="w-full flex flex-wrap gap-2">
              <template v-for="(ly, lyIndex) in line.lyrics" :key="lyIndex">
                <div class="flex flex-col w-28">
                  <el-input
                    v-model="ly.cvt"
                    class="w-full lyric-cvt h-6"
                    placeholder=""
                  />

                  <el-popover
                    placement="bottom"
                    title="推薦假名"
                    :width="200"
                    trigger="click"
                    @show="handleRecommendHiragana(ly.ori)"
                  >
                    <template #reference>
                      <el-input
                        v-model="ly.ori"
                        class="w-full lyric-ori cursor-pointer"
                        placeholder=""
                      />
                    </template>

                    <div v-loading="recommendLoading" class="flex flex-col">
                      <template
                        v-for="(hiragana, hIndex) in recommendHiraganas"
                        :key="hIndex"
                      >
                        <div
                          @click="ly.cvt = hiragana"
                          class="w-full cursor-pointer text-blue-400 hover:text-blue-600 p-1 text-center"
                        >
                          {{ hiragana }}
                        </div>
                      </template>
                    </div>
                  </el-popover>
                </div>
              </template>
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
          <el-button
            v-if="nextPageToken"
            type="warning "
            @click="loadMoreResults"
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
import { ElMessage } from "element-plus";
import axios from "axios"; // 引入 Axios
import myAxios from "@/utils/axios";

// 影片資訊
const videoId = ref("");
const videoTitle = ref("");
const videoChannel = ref("");

// YouTube Player
const playerRef = ref(null);
let player = null;
const isPlaying = ref(false);

// 歌詞
const lyricsLoading = ref(false);
const allLyrics = ref([]);
const currentLyricIndex = ref(-1);

// 歌詞貼上 Dialog
const lyricsDialogVisible = ref(false);
const originalLyrics = ref("");

// YouTube 搜尋 Dialog
const searchDialogVisible = ref(false);
const searchQuery = ref("nelke");
const searchResults = ref([]);
const loading = ref(false);
const nextPageToken = ref(false);

// 推薦假名 Dialog
const recommendQuery = ref("");
const recommendLoading = ref(false);
const recommendHiraganas = ref([]);

// YouTube API 金鑰
const apiKey = ref("");

// 時間差
const timeDiff = ref("00:00.00");

// 轉換時間字串為秒
const parseTimeToSeconds = (timeString) => {
  // convert '[mm:ss.ms]'  to seconds
  if (!timeString) return 0;
  const timeStringmatch = timeString.match(/\[(\d+):(\d+\.\d+)\]/);
  if (timeStringmatch) {
    const minutes = parseInt(timeStringmatch[1]);
    const seconds = parseFloat(timeStringmatch[2]);
    return minutes * 60 + seconds;
  }
  return 0;
};

// 複製到剪貼簿
const handleCopyToClipboard = (text) => {
  navigator.clipboard.writeText(text);
  ElMessage.success("複製成功");
};

//-- 歌詞Dialog相關 --//
const handleLyricsDialogOpen = () => {
  lyricsDialogVisible.value = true;
};

const handleLyricsDialogClose = () => {
  lyricsDialogVisible.value = false;
};

const handleLyricsDialogSubmit = async () => {
  // 透過伺服器轉換歌詞
  lyricsLoading.value = true;
  try {
    const response = await myAxios.post("/convert_lyrics", {
      lyrics: originalLyrics.value,
    });
    allLyrics.value = response.data;
  } catch (error) {
    console.error("轉換歌詞時發生錯誤：", error);
    ElMessage.error("轉換歌詞時發生錯誤");
  } finally {
    lyricsLoading.value = false;
  }
  lyricsDialogVisible.value = false;
};

//-- 插入歌詞相關 --//

const handleClearLyrics = () => {
  allLyrics.value = [];
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

    // 尋找最前面的空位
    const emptyIndex = allLyrics.value.findIndex(
      (line) => line.timestamp === "" || line.timestamp === null
    );
    if (emptyIndex !== -1) {
      allLyrics.value[emptyIndex].timestamp = formattedTime;
    } else {
      allLyrics.value.push({ timestamp: formattedTime, lyrics: "" });
    }

    nextTick(() => {
      scrollToCurrentLyric(
        emptyIndex !== -1 ? emptyIndex : allLyrics.value.length - 1
      );
    });
  } else {
    console.error("YouTube player is not ready yet.");
  }
};

//-- 刪除歌詞相關 --//
const handleDelete = (index) => {
  allLyrics.value.splice(index, 1);
};

//-- 複製歌詞 --//
const handleCopy = () => {
  let result = "";

  for (const line of allLyrics.value) {
    let combinedLyric = "";
    for (const lyric of line.lyrics) {
      combinedLyric += `${lyric.ori}`;
    }
    result += `${line.timestamp}${combinedLyric}\n`;
  }

  navigator.clipboard.writeText(result);
  ElMessage.success("複製成功");
};

const handleCopyHiragana = () => {
  let result = [];
  for (const line of allLyrics.value) {
    let combinedLyric = "[";
    for (const lyric of line.lyrics) {
      combinedLyric += `{"cvt": "${lyric.cvt}","ori": "${lyric.ori}"},`;
    }
    combinedLyric = combinedLyric.slice(0, -1);
    combinedLyric += "]";
    result.push({
      timestamp: line.timestamp,
      lyrics: JSON.parse(combinedLyric),
    });
  }
  navigator.clipboard.writeText(JSON.stringify(result));
  ElMessage.success("複製成功");
};

//-- 推薦假名相關 --//
const handleRecommendHiragana = async (text) => {
  if (text === "") return;

  if (text === recommendQuery.value) return;

  recommendHiraganas.value = [];
  recommendLoading.value = true;
  recommendQuery.value = text;
  try {
    const response = await myAxios.get("gemini_recommend_hiragana", {
      params: { text },
    });
    recommendHiraganas.value = response.data;
  } catch (error) {
    ElMessage.error("獲取推薦假名失敗");
  } finally {
    recommendLoading.value = false;
  }
};

//-- 處理按鍵事件 --//
const handleKeyPress = (event) => {
  switch (event.key.toLowerCase()) {
    case "enter":
      handleInsert();
      break;
    case "a":
      handleYTBack(5);
      break;
    case "s":
      handleYTStop();
      break;
    case "d":
      handleYTForward(5);
      break;
  }
};

//-- YouTube 相關 --//

// 在指定時間軸開始播放
const startVideoOn = (time2) => {
  if (player) {
    player.seekTo(parseTimeToSeconds(time2));
    player.playVideo();
  }
};

// 重新載入 YouTube
const handleReloadYT = () => {
  if (player) {
    player.loadVideoById(videoId.value);
  }
};

// 往後到指定時間
const handleYTBack = (seconds) => {
  if (player) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime - seconds, true);
  }
};

// 往前到指定時間
const handleYTForward = (seconds) => {
  if (player) {
    const currentTime = player.getCurrentTime();
    player.seekTo(currentTime + seconds, true);
  }
};

// 暫停播放
const handleYTStop = () => {
  if (player) {
    player.pauseVideo();
  }
};

// YouTube API
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

// 滾動到指定歌詞
const scrollToCurrentLyric = (index) => {
  const lyricElement = document.getElementById(`lyric-${index}`);
  if (lyricElement) {
    lyricElement.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }
};

// 歌詞同步
const updateCurrentLyric = () => {
  if (player && player.getCurrentTime) {
    const currentTime = player.getCurrentTime();
    for (let i = 0; i < allLyrics.value.length; i++) {
      const nextTime =
        i < allLyrics.value.length - 1
          ? parseTimeToSeconds(allLyrics.value[i + 1].timestamp)
          : Infinity;

      if (
        currentTime >= parseTimeToSeconds(allLyrics.value[i].timestamp) &&
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

//-- 初始化 YouTube Player --//
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

//-- YouTube 搜尋 Dialog 相關 --//

// 打開 YouTube 搜尋 Dialog
const openSearchDialog = () => {
  searchDialogVisible.value = true;
};

// 關閉 YouTube 搜尋 Dialog
const closeSearchDialog = () => {
  searchDialogVisible.value = false;
};

// 搜尋 YouTube 影片
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

// 選擇 YouTube 影片
const selectVideo = (videoItemFromSearch) => {
  videoId.value = videoItemFromSearch.id.videoId;
  videoTitle.value = videoItemFromSearch.snippet.title;
  videoChannel.value = videoItemFromSearch.snippet.channelTitle;
  closeSearchDialog();
  handleFindLyrics().then(() => {
    handleReloadYT();
  });
};

// 載入更多 YouTube 影片
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

//-- 取得歌詞 --//
const handleFindLyrics = async () => {
  lyricsLoading.value = true;
  try {
    const response = await myAxios.get("/gemini_get_lyrics", {
      params: {
        title: videoTitle.value,
        channel: videoChannel.value,
      },
    });

    let res_lyrics = response.data;

    if (res_lyrics === "") {
      ElMessage.warning("找不到歌詞");
      return;
    }

    for (const line of res_lyrics) {
      if (line.lyrics.length === 0) continue;
      allLyrics.value.push(line);
    }
  } catch (error) {
    console.error("取得歌詞時發生錯誤：", error);
    ElMessage.error("取得歌詞時發生錯誤");
  } finally {
    lyricsLoading.value = false;
  }
};



const handleBulkTimeDiff = (operator) => {
  // 解析時間差格式 (mm:ss.ms)
  const deltaPattern = /(\d{2}):(\d{2})\.(\d{2})/;
  const deltaMatch = timeDiff.value.match(deltaPattern);
  if (!deltaMatch) {
    ElMessage.error("時間差格式錯誤，請輸入 mm:ss.ms");
    return;
  }

  // 將時間差轉換為毫秒
  const [_, deltaMinutes, deltaSeconds, deltaMs] = deltaMatch;
  const deltaTotalMs =
    parseInt(deltaMinutes) * 60 * 100 +
    parseInt(deltaSeconds) * 100 +
    parseInt(deltaMs);

  // 處理每一行歌詞
  allLyrics.value = allLyrics.value.map((line) => {
    const timestampPattern = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
    const match = line.timestamp.match(timestampPattern);
    if (!match) return line;

    const [_, minutes, seconds, ms] = match;
    const totalMs =
      parseInt(minutes) * 60 * 100 + parseInt(seconds) * 100 + parseInt(ms);

    // 加上時間差
    let newTotalMs = totalMs + (operator === 'add' ? deltaTotalMs : -deltaTotalMs);
    if (newTotalMs < 0) newTotalMs = 0;

    // 轉換回 mm:ss.ms 格式
    const newMinutes = Math.floor(newTotalMs / (60 * 100));
    const newSeconds = Math.floor((newTotalMs % (60 * 100)) / 100);
    const newMs = newTotalMs % 100;

    // 更新時間戳
    line.timestamp = `[${String(newMinutes).padStart(2, "0")}:${String(
      newSeconds
    ).padStart(2, "0")}.${String(newMs).padStart(2, "0")}]`;
    return line;
  });

  ElMessage.success("時間調整完成");
};

const getApiKey = async () => {
  try {
    const response = await myAxios.get("/get_yt_api_key");
    apiKey.value = response.data;
  } catch (error) {
    console.error("取得 API Key 時發生錯誤：", error);
    ElMessage.error("取得 API Key 時發生錯誤");
  }
};

onMounted(async () => {
  await initializePlayer();
  await getApiKey();
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

:deep(.lyric-cvt .el-input__wrapper) {
  background-color: darkgray;
}

:deep(.lyric-ori .el-input__wrapper) {
  background-color: cadetblue;
}

:deep(.lyric-ori .el-input__inner) {
  cursor: pointer;
  color: black;
}

:deep(.lyric-cvt .el-input__inner) {
  color: black;
}
</style>
